#!/bin/bash
# deploy-evolution-vm.sh
# Script para desplegar Evolution API en una VM (Compute Engine) con Container-Optimized OS

set -e

PROJECT_ID=${PROJECT_ID:-"payo-500801"}
REGION=${REGION:-"us-central1"}
ZONE="${REGION}-a"
VM_NAME="payo-evolution-api"
IMAGE="evolutionapi/evolution-api:v2.1.1" # Imagen oficial estable de Evolution API v2
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

# 4. Desplegar la Instancia (VM) con Docker (Container-Optimized OS)
echo "💻 Desplegando Máquina Virtual ($VM_NAME) con Docker..."

set +e
gcloud compute instances describe $VM_NAME --zone=$ZONE --project=$PROJECT_ID > /dev/null 2>&1
VM_EXISTS=$?
set -e

if [ $VM_EXISTS -ne 0 ]; then
    # El flag --container-mount-host-path asegura que los datos (sesiones de WhatsApp) sobrevivan a los reinicios del contenedor
    gcloud compute instances create-with-container $VM_NAME \
        --project=$PROJECT_ID \
        --zone=$ZONE \
        --machine-type=e2-micro \
        --tags=evolution-api \
        --container-image=$IMAGE \
        --container-env="AUTHENTICATION_TYPE=apikey,AUTHENTICATION_API_KEY=$API_KEY,SERVER_PORT=8080" \
        --container-mount-host-path=host-path=/var/evolution/instances,mount-path=/evolution/instances,mode=rw \
        --container-mount-host-path=host-path=/var/evolution/store,mount-path=/evolution/store,mode=rw \
        --container-restart-policy=always
else
    echo "La VM $VM_NAME ya existe. Actualizando contenedor..."
    gcloud compute instances update-container $VM_NAME \
        --project=$PROJECT_ID \
        --zone=$ZONE \
        --container-image=$IMAGE \
        --container-env="AUTHENTICATION_TYPE=apikey,AUTHENTICATION_API_KEY=$API_KEY,SERVER_PORT=8080" \
        --container-mount-host-path=host-path=/var/evolution/instances,mount-path=/evolution/instances,mode=rw \
        --container-mount-host-path=host-path=/var/evolution/store,mount-path=/evolution/store,mode=rw
fi

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
