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
    if request.method == 'POST':
        if request.is_json:
            # Data dikirim sebagai JSON
            new_activity = request.get_json()
            data_storage.append(new_activity)
            return jsonify({"message": "Activity added successfully!"}), 201
        else:
            # Data dikirim sebagai form
            try:
                new_activity = {
                    "id": len(data_storage) + 1,
                    "activity": request.form['activity'],
                    "iso": request.form['iso'],
                    "date": request.form['date'],
                    "description": request.form['description'],
                    "files": [],
                    "sub_activities": []
                }
                data_storage.append(new_activity)
                return jsonify({"message": "Activity added successfully!"}), 201
            except KeyError as e:
                return f"KeyError: Missing form field {str(e)}", 400
    return render_template('add1.html')


# Page and API to view and add sub-activity
@app.route('/sub_activity/<int:activity_id>', methods=['GET', 'POST'])
def sub_activity(activity_id):
    print(f"Received activity_id: {activity_id}")  # Debugging
    activity = next((item for item in data_storage if item['id'] == activity_id), None)
    if not activity:
        print(f"Activity not found: {activity_id}")
        return "Activity not found", 404

    if request.method == 'POST':
        sub_activity_name = request.form['subActivityName']
        uploaded_files = request.files.getlist('files')

        # Save uploaded files
        saved_files = []
        for file in uploaded_files:
            file_path = os.path.join('static/files', file.filename)
            file.save(file_path)
            saved_files.append(file.filename)

        # Add sub-activity
        new_sub_activity = {
            "id": len(activity['sub_activities']) + 1,
            "name": sub_activity_name,
            "uploaded_at": datetime.now().strftime("%Y-%m-%d"),
            "files": saved_files
        }
        activity["sub_activities"].append(new_sub_activity)
        return jsonify({"message": "Sub activity added successfully!"})

    return render_template('sub_activity.html', activity=activity)

#update sub
@app.route('/sub_activity/<int:sub_id>/delete_file', methods=['POST'])
def delete_file(sub_id):
    file_name = request.json.get('file')
    for activity in data_storage:
        for sub in activity["sub_activities"]:
            if sub["id"] == sub_id:
                if file_name in sub["files"]:
                    sub["files"].remove(file_name)
                    return jsonify({"message": "File deleted successfully!"})
    return jsonify({"message": "File not found!"}), 404


@app.route('/sub_activity/<int:sub_id>/delete', methods=['POST'])
def delete_sub_activity(sub_id):
    for activity in data_storage:
        activity["sub_activities"] = [
            sub for sub in activity["sub_activities"] if sub["id"] != sub_id
        ]
    return jsonify({"message": "Sub-activity deleted successfully!"})


@app.route('/sub_activity/<int:sub_id>/edit', methods=['GET'])
def edit_sub_activity(sub_id):
    # Cari sub-aktivitas berdasarkan ID
    for activity in data_storage:
        for sub in activity["sub_activities"]:
            if sub["id"] == sub_id:
                return render_template('update_sub_activity.html', sub_activity=sub)
    return "Sub-activity not found", 404

@app.route('/sub_activity/<int:sub_id>/update', methods=['POST'])
def update_sub_activity(sub_id):
    updated_name = request.form.get('updatedName')
    updated_date = request.form.get('updatedDate')
    new_files = request.files.getlist('newFiles')

    # Iterasi untuk menemukan sub-activity yang sesuai
    for activity in data_storage:
        for sub in activity["sub_activities"]:
            if sub["id"] == sub_id:
                # Update data jika ada input
                if updated_name:
                    sub["name"] = updated_name
                if updated_date:
                    sub["uploaded_at"] = updated_date

                # Menyimpan file baru
                for file in new_files:
                    if file and file.filename:  # Pastikan ada file
                        file_path = f'static/files/{file.filename}'
                        try:
                            file.save(file_path)  # Simpan file
                        except PermissionError:
                            return jsonify({'status': 'error', 'message': 'Permission denied to save file'}), 500

                        # Tambahkan ke daftar file jika belum ada
                        if file.filename not in sub["files"]:
                            sub["files"].append(file.filename)

                # Respon sukses
                return jsonify({
                    'status': 'success',
                    'message': 'Sub activity updated successfully',
                })

    # Jika sub-activity tidak ditemukan
    return jsonify({'status': 'error', 'message': 'Sub-activity not found'}), 404

@app.route('/activity/<int:activity_id>/delete', methods=['POST'])
def delete_activity(activity_id):
    global data_storage
    # Cari aktivitas berdasarkan ID dan hapus
    activity_to_delete = next((activity for activity in data_storage if activity['id'] == activity_id), None)
    if activity_to_delete:
        data_storage.remove(activity_to_delete)
        return jsonify({"message": "Activity deleted successfully!"}), 200
    return jsonify({"message": "Activity not found!"}), 404


# Route untuk download semua file dari sub-activity
@app.route('/activity/<int:activity_id>/download', methods=['GET'])
def download_activity_files(activity_id):
    # Cari activity berdasarkan ID
    activity = next((item for item in data_storage if item['id'] == activity_id), None)
    if not activity:
        return jsonify({"message": "Activity not found!"}), 404

    # Gabungkan semua file dari sub-activities
    all_files = []
    for sub in activity.get("sub_activities", []):
        all_files.extend(sub.get("files", []))

    if not all_files:
        return jsonify({"message": "No files to download in sub-activities!"}), 404

    # Membuat file ZIP dalam memori
    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        for file_name in all_files:
            file_path = os.path.join('static/files', file_name)
            if os.path.exists(file_path):
                zf.write(file_path, arcname=file_name)  # Tambahkan file ke ZIP

    memory_file.seek(0)  # Reset pointer file ZIP

    # Mengembalikan file ZIP ke user
    return send_file(
        memory_file,
        mimetype='application/zip',
        as_attachment=True,
        download_name=f'activity_{activity_id}_files.zip'
    )
if __name__ == "__main__":
    app.run(debug=True)
