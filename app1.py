from flask import Flask, render_template, request, jsonify, redirect, send_file
import os
from datetime import datetime
import io
import zipfile

app = Flask(__name__, static_folder='static', template_folder='templates')

iso_list = ["ISO 45001", "ISO 9001", "ISO 9003"]
data_storage = []

# Home Page
@app.route('/')
def index():
    return render_template('index1.html')

# API to get ISO list
@app.route('/get_iso', methods=['GET'])
def get_iso():
    return jsonify(iso_list)

# API to add new ISO
@app.route('/add_iso', methods=['POST'])
def add_iso():
    new_iso = request.json.get('iso')
    if new_iso and new_iso not in iso_list:
        iso_list.append(new_iso)
        return jsonify({"message": "ISO added successfully!", "iso_list": iso_list})
    return jsonify({"message": "ISO already exists or invalid input!"}), 400

# API to get data by ISO
@app.route('/get_data/<iso>', methods=['GET'])
def get_data(iso):
    filtered_data = [item for item in data_storage if item['iso'] == iso]
    return jsonify(filtered_data)

@app.route('/add', methods=['GET', 'POST'])
def add_data():
    if request.method == 'GET':
        selected_iso = request.args.get('iso', '')  # ISO dari query string
        if not selected_iso:
            return redirect('/')  # Jika tidak ada ISO, kembali ke halaman utama
        return render_template('add1.html', selected_iso=selected_iso)

    elif request.method == 'POST':
        try:
            new_activity = {
                "id": len(data_storage) + 1,
                "activity": request.form['activity'],
                "iso": request.form['iso'],
                "date": datetime.now().strftime('%Y-%m-%d'),  # Tanggal otomatis
                "description": request.form['description'],
                "files": [],
                "sub_activities": [],  # Menambahkan sub-activities
            }
            # Tangani file yang diunggah
            if 'file' in request.files:
                uploaded_files = request.files.getlist('file')
                print(f"Received files: {[file.filename for file in uploaded_files]}")  # Debugging log
                for uploaded_file in uploaded_files:
                    filename = uploaded_file.filename
                    filepath = os.path.join('uploads', filename)
                    uploaded_file.save(filepath)
                    new_activity["files"].append(filename)
            else:
                print("No files found in request")  # Debugging log

            # Tangani sub-activities
            sub_activities = []
            for key in request.form:
                if key.startswith("sub_activities"):
                    sub_activity_index = key.split("[")[1].split("]")[0]  # Ambil index sub-activity
                    sub_activity_name = request.form.get(f"sub_activities[{sub_activity_index}][name]")
                    sub_activity_files = request.files.getlist(f"sub_activities[{sub_activity_index}][file]")
                    sub_activity_data = {
                        "name": sub_activity_name,
                        "files": []
                    }

                    # Simpan file sub-activity
                    for sub_file in sub_activity_files:
                        filename = sub_file.filename
                        filepath = os.path.join('uploads', filename)
                        sub_file.save(filepath)
                        sub_activity_data["files"].append(filename)

                    sub_activities.append(sub_activity_data)

            # Menambahkan sub-activities ke aktivitas utama
            new_activity["sub_activities"] = sub_activities
            data_storage.append(new_activity)

            return jsonify({"message": "Activity added successfully!"}), 201
        except KeyError as e:
            return f"KeyError: Missing form field {str(e)}", 400
    return render_template('add1.html')

@app.route('/activity/<int:activity_id>/delete', methods=['POST'])
def delete_activity(activity_id):
    global data_storage
    # Cari aktivitas berdasarkan ID dan hapus
    activity_to_delete = next((activity for activity in data_storage if activity['id'] == activity_id), None)
    if activity_to_delete:
        data_storage.remove(activity_to_delete)
        return jsonify({"message": "Activity deleted successfully!"}), 200
    return jsonify({"message": "Activity not found!"}), 404


@app.route('/activity/<int:activity_id>/files', methods=['GET'])
def get_activity_files(activity_id):
    activity = next((item for item in data_storage if item["id"] == activity_id), None)
    if activity:
        print(f"Files for activity {activity_id}: {activity['files']}")  # Debug
        return jsonify(activity["files"])
    print(f"Activity {activity_id} not found!")  # Debug
    return jsonify({"message": "Activity not found!"}), 404

@app.route('/activity/<int:activity_id>/upload', methods=['POST'])
def upload_file(activity_id):
    # Cari aktivitas berdasarkan ID
    activity = next((item for item in data_storage if item["id"] == activity_id), None)
    if not activity:
        return jsonify({"message": "Activity not found!"}), 404

    # Cek apakah ada file dalam request
    if 'file' not in request.files:
        return jsonify({"message": "No file provided!"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "No selected file!"}), 400

    # Tambahkan nama file ke aktivitas
    activity["files"].append(file.filename)
    return jsonify({"message": f"File {file.filename} uploaded successfully!"}), 200

@app.route('/activity/<int:activity_id>/subactivities', methods=['GET'])
def get_subactivities(activity_id):
    # Mengambil sub-activities dari aktivitas yang ada
    activity = next((item for item in data_storage if item["id"] == activity_id), None)
    if activity:
        return jsonify(activity["sub_activities"])  # Kembalikan sub-activities yang ada
    else:
        return jsonify({"message": "No sub-activities found"}), 404

if __name__ == "__main__":
    app.run(debug=True)
