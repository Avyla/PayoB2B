INSERT INTO "Comercios" (id_comercio, nombre_comercio, nit_identificacion, fecha_creacion)
VALUES ('11111111-1111-1111-1111-111111111111', 'Comercio de Prueba', '900123456-1', NOW())
ON CONFLICT DO NOTHING;

INSERT INTO "Usuarios" (id_usuario, id_comercio, email, nombre_completo, password_hash, rol, telefono_whatsapp, fecha_creacion)
VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'admin@prueba.com', 'Admin Prueba', 'hashedpass', 'ADMINISTRADOR', '+573001234567', NOW())
ON CONFLICT DO NOTHING;
