#!/bin/bash
# deploy-evolution-vm.sh
# Script para desplegar Evolution API en una VM (Compute Engine) con Container-Optimized OS

set -e

PROJECT_ID=${PROJECT_ID:-"payo-500801"}
REGION=${REGION:-"us-central1"}
ZONE="${REGION}-a"
VM_NAME="payo-evolution-api"
IMAGE="evoapicloud/evolution-api:latest" # Imagen oficial estable de Evolution API
BACKEND_SERVICE_NAME="payo-backend"

echo "=================================================="
echo "🚀 Iniciando despliegue de Evolution API (VM)"
echo "Project ID: $PROJECT_ID"
echo "Zone: $ZONE"
echo "=================================================="

# 1. Asegurar que estamos en el proyecto correcto
gcloud config set project $PROJECT_ID

# 2. Generar/Obtener la API KEY de Evolution
echo "🔑 Configurando API Key para Evolution..."
# Verificamos si existe en Secret Manager, si no la creamos
set +e
SECRET_EXISTS=$(gcloud secrets describe WHATSAPP_API_TOKEN --project=$PROJECT_ID 2>/dev/null)
set -e

if [ -z "$SECRET_EXISTS" ]; then
    echo "Creando secreto WHATSAPP_API_TOKEN..."
    API_KEY="payo_evo_$(openssl rand -hex 16)"
    printf "$API_KEY" | gcloud secrets create WHATSAPP_API_TOKEN --data-file=- --project=$PROJECT_ID
else
    echo "El secreto WHATSAPP_API_TOKEN ya existe. Obteniendo valor..."
    API_KEY=$(gcloud secrets versions access latest --secret="WHATSAPP_API_TOKEN" --project=$PROJECT_ID)
fi

# 3. Crear regla de Firewall para puerto 8080 (Si no existe)
echo "🛡️ Verificando regla de firewall para el puerto 8080..."
set +e
gcloud compute firewall-rules describe allow-evolution-8080 --project=$PROJECT_ID > /dev/null 2>&1
RULE_EXISTS=$?
set -e

if [ $RULE_EXISTS -ne 0 ]; then
    echo "Creando regla de firewall 'allow-evolution-8080'..."
    gcloud compute firewall-rules create allow-evolution-8080 \
        --project=$PROJECT_ID \
        --direction=INGRESS \
        --priority=1000 \
        --network=default \
        --action=ALLOW \
        --rules=tcp:8080 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=evolution-api
else
    echo "La regla de firewall ya existe."
fi

# 4. Desplegar la Instancia (VM) con Docker Compose y Redis
echo "💻 Desplegando Máquina Virtual ($VM_NAME) con Docker Compose..."

# Definimos el startup-script que se ejecutará al iniciar la VM
cat << 'EOF' > startup-script.sh
#!/bin/bash
# Actualizar e instalar dependencias
apt-get update
apt-get install -y apt-transport-https ca-certificates curl software-properties-common
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
# Instalar Docker Compose Plugin
apt-get install -y docker-compose-plugin

# Crear directorios para los datos
mkdir -p /opt/evolution/instances
mkdir -p /opt/evolution/store
mkdir -p /opt/evolution/redis

# Crear docker-compose.yml
cat << 'DOCKER_COMPOSE_EOF' > /opt/evolution/docker-compose.yml
version: "3.7"
services:
  redis:
    image: redis:alpine
    container_name: evo-redis
    restart: always
    volumes:
      - /opt/evolution/redis:/data
    command: redis-server --appendonly yes

  evolution:
    image: evoapicloud/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    depends_on:
      - redis
    environment:
      - SERVER_PORT=8080
      - AUTHENTICATION_TYPE=apikey
      # El script de la VM reemplazará este valor:
      - AUTHENTICATION_API_KEY=API_KEY_PLACEHOLDER
      - REDIS_URI=redis://redis:6379
      - CACHE_REDIS_URI=redis://redis:6379/1
    volumes:
      - /opt/evolution/instances:/evolution/instances
      - /opt/evolution/store:/evolution/store
DOCKER_COMPOSE_EOF

# Reemplazar la API KEY en el docker-compose
sed -i "s/API_KEY_PLACEHOLDER/$API_KEY_ENV/g" /opt/evolution/docker-compose.yml

# Levantar los contenedores
cd /opt/evolution
docker compose up -d
EOF

# Inyectamos la API Key en el script (antes de enviarlo a GCP)
sed -i.bak "s/\$API_KEY_ENV/$API_KEY/g" startup-script.sh

set +e
gcloud compute instances describe $VM_NAME --zone=$ZONE --project=$PROJECT_ID > /dev/null 2>&1
VM_EXISTS=$?
set -e

if [ $VM_EXISTS -ne 0 ]; then
    gcloud compute instances create $VM_NAME \
        --project=$PROJECT_ID \
        --zone=$ZONE \
        --machine-type=e2-micro \
        --image-family=ubuntu-2204-lts \
        --image-project=ubuntu-os-cloud \
        --tags=evolution-api \
        --metadata-from-file startup-script=startup-script.sh
else
    echo "La VM $VM_NAME ya existe. Eliminándola para recrearla con Redis..."
    gcloud compute instances delete $VM_NAME --zone=$ZONE --project=$PROJECT_ID --quiet
    echo "Creando nueva VM $VM_NAME..."
    gcloud compute instances create $VM_NAME \
        --project=$PROJECT_ID \
        --zone=$ZONE \
        --machine-type=e2-micro \
        --image-family=ubuntu-2204-lts \
        --image-project=ubuntu-os-cloud \
        --tags=evolution-api \
        --metadata-from-file startup-script=startup-script.sh
fi

rm startup-script.sh startup-script.sh.bak || true

# 5. Obtener la IP Pública de la VM
echo "🌐 Obteniendo IP pública de Evolution API..."
EVO_IP=$(gcloud compute instances describe $VM_NAME \
  --zone=$ZONE \
  --project=$PROJECT_ID \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

EVO_URL="http://${EVO_IP}:8080"
echo "✅ Evolution API desplegada y disponible en: $EVO_URL"

# 6. Actualizar el Backend en Cloud Run con la nueva URL
echo "🔗 Actualizando payo-backend para que apunte a Evolution API..."
gcloud run services update $BACKEND_SERVICE_NAME \
  --region $REGION \
  --project $PROJECT_ID \
  --update-env-vars EVOLUTION_API_URL="$EVO_URL"

echo "=================================================="
echo "🎉 Despliegue de Evolution API Completado"
echo "URL: $EVO_URL"
echo "API Key (guardada en Secret Manager): $API_KEY"
echo "=================================================="
