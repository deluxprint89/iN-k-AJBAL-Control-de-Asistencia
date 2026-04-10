import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import pandas as pd
import os

# INSTRUCCIONES:
# 1. Descarga tu llave de cuenta de servicio desde la consola de Firebase.
# 2. Guárdala con el nombre 'serviceAccountKey.json' en esta misma carpeta.
# 3. Instala las librerías necesarias: pip install firebase-admin pandas openpyxl

def export_firestore_data():
    # Ruta al archivo de credenciales
    cert_path = 'serviceAccountKey.json'
    
    if not os.path.exists(cert_path):
        print(f"ERROR: No se encontró el archivo '{cert_path}'.")
        print("Por favor, descárgalo desde la Consola de Firebase > Configuración > Cuentas de servicio.")
        return

    try:
        # Inicializar Firebase Admin SDK
        cred = credentials.Certificate(cert_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()

        print("--- Conexión establecida con Firebase ---")

        # 1. Exportar Empleados
        print("Obteniendo datos de empleados...")
        employees_ref = db.collection('employees')
        emp_docs = employees_ref.stream()
        
        employees_data = []
        for doc in emp_docs:
            data = doc.to_dict()
            data['id_firestore'] = doc.id
            employees_data.append(data)

        if employees_data:
            df_emp = pd.DataFrame(employees_data)
            df_emp.to_excel('reporte_empleados_erp.xlsx', index=False)
            print("✅ Archivo 'reporte_empleados_erp.xlsx' generado con éxito.")
        else:
            print("⚠️ No se encontraron empleados en la base de datos.")

        # 2. Exportar Asistencias
        print("Obteniendo registros de asistencia...")
        attendance_ref = db.collection('attendance')
        att_docs = attendance_ref.stream()
        
        attendance_data = []
        for doc in att_docs:
            data = doc.to_dict()
            data['id_firestore'] = doc.id
            attendance_data.append(data)

        if attendance_data:
            df_att = pd.DataFrame(attendance_data)
            df_att.to_csv('reporte_asistencias_erp.csv', index=False, encoding='utf-8-sig')
            print("✅ Archivo 'reporte_asistencias_erp.csv' generado con éxito.")
        else:
            print("⚠️ No se encontraron registros de asistencia.")

    except Exception as e:
        print(f"❌ Ocurrió un error: {e}")

if __name__ == "__main__":
    export_firestore_data()
