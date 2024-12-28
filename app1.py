from flask import Flask, render_template, request, jsonify, redirect, send_file
import os
from datetime import datetime
import io
from werkzeug.utils import secure_filename
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
    print(filtered_data)
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
            sub_activities = []
            description = ""
            for key in request.form:
                if key.startswith("sub_activities"):
                    sub_activity_index = key.split("[")[1].split("]")[0]
                    sub_activity_name = request.form.get(f"sub_activities[{sub_activity_index}][name]")
                    sub_activity_files = request.files.getlist(f"sub_activities[{sub_activity_index}][file]")
                    
                    sub_activity_data = {
                        "name": sub_activity_name,
                        "files": []
                    }

                    description += f"{sub_activity_name}:\n"
                    for idx, sub_file in enumerate(sub_activity_files):
                        filename = sub_file.filename
                        filepath = os.path.join('uploads', filename)
                        
                        if filename not in sub_activity_data["files"]:
                            sub_file.save(filepath)
                            sub_activity_data["files"].append(filename)
                            description += f"{idx + 1}. {filename}\n"

                    sub_activities.append(sub_activity_data)
                    description += "\n"

            new_activity = {
                "id": len(data_storage) + 1,
                "activity": request.form['activity'],
                "iso": request.form['iso'],
                "date": datetime.now().strftime('%Y-%m-%d'),  # Tanggal otomatis
                "description": description.strip(),  # Menggunakan deskripsi yang dihasilkan
                "files": [],
                "sub_activities": sub_activities
            }

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

@app.route('/activity/<int:activity_id>/download', methods=['GET'])
def download_file(activity_id):
    file_name = request.args.get('file')
    file_path = os.path.join('uploads', file_name)
    
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    return jsonify({"message": "File not found!"}), 404



@app.route('/activity/<int:activity_id>', methods=['GET'])
def get_activity(activity_id):
    """Mengambil data aktivitas berdasarkan ID."""
    activity = next((item for item in data_storage if item['id'] == activity_id), None)
    if activity:
        return jsonify(activity), 200
    return jsonify({"message": "Activity not found!"}), 404

@app.route('/activity/<int:activity_id>/edit', methods=['POST'])
def edit_activity(activity_id):
    """Mengedit aktivitas berdasarkan ID."""
    activity = next((item for item in data_storage if item['id'] == activity_id), None)
    if not activity:
        return jsonify({"message": "Activity not found!"}), 404

    try:
        # Jika request berisi deleteSubFolder
        delete_sub_folder = request.form.get('deleteSubFolder')
        if delete_sub_folder:
            activity['sub_activities'] = [
                sub for sub in activity['sub_activities'] if sub['name'] != delete_sub_folder
            ]
            sub_folder_path = os.path.join('uploads', delete_sub_folder)
            if os.path.exists(sub_folder_path):
                shutil.rmtree(sub_folder_path)  # Hapus folder secara fisik
            return jsonify({"message": "Sub-folder deleted successfully!"}), 200


        # Jika request berisi deleteFile
        delete_file = request.form.get('deleteFile')
        if delete_file:
            sub_folder_name = request.form.get('subFolder')
            if sub_folder_name:
                sub_folder = next(
                    (sub for sub in activity['sub_activities'] if sub['name'] == sub_folder_name), None)
                if sub_folder and delete_file in sub_folder['files']:
                    sub_folder['files'].remove(delete_file)
                    file_path = os.path.join('uploads', sub_folder_name, delete_file)
                    if os.path.exists(file_path):
                        os.remove(file_path)  # Hapus file secara fisik
            return jsonify({"message": "File deleted successfully!"}), 200

        # Edit nama aktivitas
        new_name = request.form.get('activityName')
        if new_name:
            activity['activity'] = new_name

        # Tambahkan sub-folder
        sub_folder_name = request.form.get('subFolder')
        if sub_folder_name:
            new_sub_folder = {
                "name": sub_folder_name,
                "files": []
            }
            activity['sub_activities'].append(new_sub_folder)

        # Tambahkan file ke sub-folder
        if 'file' in request.files:
            file = request.files['file']
            if file.filename != '':
                if sub_folder_name:  # Simpan file ke sub-folder jika ada
                    sub_folder_path = os.path.join('uploads')
                    os.makedirs(sub_folder_path, exist_ok=True)  # Buat sub-folder jika belum ada
                    file_path = os.path.join(sub_folder_path, file.filename)
                else:  # Simpan file ke folder utama jika tidak ada sub-folder
                    file_path = os.path.join('uploads', file.filename)
                
                file.save(file_path)

                # Tambahkan file ke sub-folder
                if sub_folder_name:
                    new_sub_folder['files'].append(file.filename)
                else:
                    activity['files'].append(file.filename)
        
        # Jika request berisi addToSubFolder
        add_to_sub_folder = request.form.get('addToSubFolder')
        if add_to_sub_folder:
            sub_folder = next(
                (sub for sub in activity['sub_activities'] if sub['name'] == add_to_sub_folder), None
            )
            if sub_folder:
                sub_folder_path = os.path.join('uploads', add_to_sub_folder)
                os.makedirs(sub_folder_path, exist_ok=True)

                uploaded_files = request.files.getlist("files")
                for file in uploaded_files:
                    if file.filename != '':
                        filename = secure_filename(file.filename)
                        file_path = os.path.join(sub_folder_path, filename)
                        file.save(file_path)
                        sub_folder['files'].append(filename)
            else:
                return jsonify({"message": "Sub-folder not found!"}), 404

        return jsonify({
            "message": "Activity updated successfully!"}), 200
    except Exception as e:
        return jsonify({"message": f"Error updating activity: {str(e)}"}), 500



@app.route('/activity/<int:activity_id>/subactivity/<subactivity_name>/delete_file', methods=['POST'])
def delete_subactivity_file(activity_id, subactivity_name):
    """Menghapus file dari sub-folder."""
    activity = next((item for item in data_storage if item['id'] == activity_id), None)
    if not activity:
        return jsonify({"message": "Activity not found!"}), 404

    sub_activity = next((sub for sub in activity['sub_activities'] if sub['name'] == subactivity_name), None)
    if not sub_activity:
        return jsonify({"message": "Sub-activity not found!"}), 404

    file_name = request.json.get('fileName')
    if file_name in sub_activity['files']:
        sub_activity['files'].remove(file_name)
        return jsonify({"message": f"File {file_name} deleted successfully!"}), 200
    return jsonify({"message": "File not found in sub-activity!"}), 404


if __name__ == "__main__":
    app.run(debug=True)
