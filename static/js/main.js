document.addEventListener('DOMContentLoaded', () => {
    const isoSelect = document.getElementById('isoSelect');
    const auditTableBody = document.querySelector('#auditTable tbody');

    // Load ISO options
    fetch('/get_iso')
        .then(response => response.json())
        .then(data => {
            data.forEach(iso => {
                const option = document.createElement('option');
                option.value = iso;
                option.textContent = iso;
                isoSelect.appendChild(option);
            });
        });

    // Load activities based on ISO
    isoSelect.addEventListener('change', () => {
        const selectedISO = isoSelect.value;
        fetch(`/get_data/${selectedISO}`)
            .then(response => response.json())
            .then(data => {
                auditTableBody.innerHTML = '';
                data.forEach(activity => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${activity.id}</td>
                        <td>${activity.activity}</td>
                        <td>${activity.date}</td>
                        <td>${activity.description}</td>
                        <td>
                            <button class="delete-btn" data-id="${activity.id}">Delete</button>
                            <button class="view-btn" data-id="${activity.id}">View</button>
                            <button class="edit-btn" data-id="${activity.id}">Edit</button>
                        </td>
                    `;
                    auditTableBody.appendChild(row);
                });
            });
    });

    // Add delete functionality
    auditTableBody.addEventListener("click", function (event) {
        if (event.target.classList.contains("delete-btn")) {
            const activityId = event.target.getAttribute("data-id");

            if (confirm("Are you sure you want to delete this activity?")) {
                fetch(`/activity/${activityId}/delete`, {
                    method: "POST",
                })
                    .then((response) => response.json())
                    .then((data) => {
                        alert(data.message);
                        const row = event.target.closest("tr");
                        row.remove(); // Remove the row from the table
                    })
                    .catch((error) => console.error("Error:", error));
            }
        }
    });

    // Add view functionality with table layout
    auditTableBody.addEventListener("click", (event) => {
        if (event.target.classList.contains("view-btn")) {
            const activityId = event.target.getAttribute("data-id");

            fetch(`/activity/${activityId}/subactivities`)
                .then((response) => response.json())
                .then((subActivities) => {
                    if (Array.isArray(subActivities) && subActivities.length > 0) {
                        let subActivityHTML = '<table style="width:100%; border-collapse: collapse; text-align: left;">';
                        subActivityHTML += `
                            <thead>
                                <tr style="background-color: #4CAF50; border-bottom: 2px solid #ddd;">
                                    <th style="padding: 10px;">Sub-Activity Name</th>
                                    <th style="padding: 10px;">File Name</th>
                                    <th style="padding: 10px;">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                        `;

                        subActivities.forEach((subActivity) => {
                            subActivityHTML += `
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                                        <strong>${subActivity.name}</strong>
                                    </td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                                        <ul style="list-style-type: none; margin: 0; padding: 0;">
                                            ${subActivity.files.map(file => `<li>${file}</li>`).join('')}
                                        </ul>
                                    </td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                                        <ul style="list-style-type: none; margin: 0; padding: 0;">
                                            ${subActivity.files.map(file => `
                                                <li>
                                                    <button 
                                                        class="download-btn" 
                                                        data-id="${activityId}" 
                                                        data-file="${file}" 
                                                        style="padding: 5px 10px; background-color: #4CAF50; color: #fff; border: none; border-radius: 3px; cursor: pointer; ">
                                                        Download
                                                    </button>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    </td>
                                </tr>
                            `;
                        });

                        subActivityHTML += '</tbody></table>';
                        Swal.fire({
                            title: "Sub-Activities & Files",
                            html: subActivityHTML,
                            icon: "info",
                            confirmButtonText: "Close",
                        });

                        // Add event listeners for download buttons
                        document.querySelectorAll('.download-btn').forEach(button => {
                            button.addEventListener('click', (event) => {
                                const file = event.target.getAttribute('data-file');
                                const activityId = event.target.getAttribute('data-id');
                                const downloadUrl = `/activity/${activityId}/download?file=${encodeURIComponent(file)}`;
                                
                                // Trigger file download
                                window.open(downloadUrl, '_blank');
                            });
                        });
                    } else {
                        Swal.fire({
                            title: "No Sub-Activities Found",
                            text: "This activity has no sub-activities or files.",
                            icon: "warning",
                            confirmButtonText: "OK",
                        });
                    }
                })
                .catch((error) => {
                    console.error("Error fetching sub-activities:", error);
                    Swal.fire({
                        title: "Error",
                        text: "Unable to fetch sub-activities. Please try again later.",
                        icon: "error",
                        confirmButtonText: "OK",
                    });
                });
        }
    });

    // Tambahkan event listener untuk tombol Edit
    // Tambahkan event listener untuk tombol Edit
    auditTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-btn')) {
            const activityId = event.target.getAttribute('data-id');
            
            fetch(`/activity/${activityId}`)
                .then(response => response.json())
                .then(activity => {
                    // Bangun HTML Form untuk fitur tambahan
                    const formHTML = `
                    <form id="editForm" style="font-family: Arial, sans-serif; line-height: 1.5;">
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                            <tbody>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                                        <label for="activityName" style="font-weight: bold;">Activity Name:</label>
                                    </td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                                        <input type="text" id="activityName" name="activityName" value="${activity.activity}" 
                                            required 
                                            style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                                        <label for="subFolder" style="font-weight: bold;">Add Sub-Folder:</label>
                                    </td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                                        <input type="text" id="subFolder" name="subFolder" 
                                            style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                                        <label for="file" style="font-weight: bold;">Upload File:</label>
                                    </td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                                        <input type="file" id="file" name="file">
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding: 10px; border-bottom: 1px solid #ddd;">
                                        <hr>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                                        <label for="subFolderSelect" style="font-weight: bold;">Select Sub-Folder:</label>
                                    </td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                                        <select id="subFolderSelect" name="subFolderSelect" 
                                            style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                                            <option value="">-- Select Sub-Folder --</option>
                                            ${activity.sub_activities
                                                .map((sub) => `<option value="${sub.name}">${sub.name}</option>`)
                                                .join("")}
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                                        <label for="fileSelect" style="font-weight: bold;">Select File to Delete:</label>
                                    </td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                                        <select id="fileSelect" name="fileSelect" 
                                            style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                                            <option value="">-- Select File --</option>
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">
                                        <button type="button" id="deleteFileBtn" 
                                            style="padding: 8px 12px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                            Delete File
                                        </button>
                                        <button type="button" id="deleteSubFolderBtn" 
                                            style="padding: 8px 12px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                            Delete Sub-Folder
                                        </button>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding: 10px; border-bottom: 1px solid #ddd;">
                                        <hr>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                                        <label for="addFilesInput" style="font-weight: bold;">Add Files to Sub-Folder:</label>
                                    </td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                                        <input type="file" id="addFilesInput" name="addFilesInput" multiple>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding: 10px; text-align: right;">
                                        <button type="button" id="addFilesBtn" 
                                            style="padding: 8px 12px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                            Add Files
                                        </button>
                                        <button type="submit" 
                                            style="padding: 8px 12px; background-color: #008CBA; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                            Save
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </form>
                `;

                    Swal.fire({
                        title: "Edit Activity",
                        html: formHTML,
                        showConfirmButton: false,
                    });

                    const subFolderSelect = document.getElementById('subFolderSelect');
                    const fileSelect = document.getElementById('fileSelect');
                    const addFilesInput = document.getElementById("addFilesInput");


                    // Event listener untuk memuat file dari sub-folder terpilih
                    subFolderSelect.addEventListener('change', () => {
                        const selectedSubFolder = subFolderSelect.value;
                        const subActivity = activity.sub_activities.find(sub => sub.name === selectedSubFolder);

                        fileSelect.innerHTML = '<option value="">-- Select File --</option>';
                        if (subActivity && subActivity.files) {
                            subActivity.files.forEach(file => {
                                const option = document.createElement('option');
                                option.value = file;
                                option.textContent = file;
                                fileSelect.appendChild(option);
                            });
                        }
                    });

                    // Event listener untuk menghapus file
                    document.getElementById('deleteFileBtn').addEventListener('click', () => {
                        const selectedSubFolder = subFolderSelect.value;
                        const selectedFile = fileSelect.value;

                        if (!selectedSubFolder || !selectedFile) {
                            Swal.fire({
                                title: "Error",
                                text: "Please select a sub-folder and file to delete.",
                                icon: "error",
                                confirmButtonText: "OK",
                            });
                            return;
                        }

                        const formData = new FormData();
                        formData.append('subFolder', selectedSubFolder);
                        formData.append('deleteFile', selectedFile);

                        fetch(`/activity/${activityId}/edit`, {
                            method: 'POST',
                            body: formData,
                        })
                        .then(response => response.json())
                        .then(data => {
                            Swal.fire({
                                title: "Success",
                                text: data.message,
                                icon: "success",
                                confirmButtonText: "OK",
                            }).then(() => location.reload());
                        })
                        .catch(error => {
                            console.error("Error deleting file:", error);
                            Swal.fire({
                                title: "Error",
                                text: "Failed to delete file.",
                                icon: "error",
                                confirmButtonText: "OK",
                            });
                        });
                    });

                    // Event listener untuk menghapus sub-folder
                    document.getElementById('deleteSubFolderBtn').addEventListener('click', () => {
                        const selectedSubFolder = subFolderSelect.value;

                        if (!selectedSubFolder) {
                            Swal.fire({
                                title: "Error",
                                text: "Please select a sub-folder to delete.",
                                icon: "error",
                                confirmButtonText: "OK",
                            });
                            return;
                        }

                        const formData = new FormData();
                        formData.append('deleteSubFolder', selectedSubFolder);

                        fetch(`/activity/${activityId}/edit`, {
                            method: 'POST',
                            body: formData,
                        })
                        .then(response => response.json())
                        .then(data => {
                            Swal.fire({
                                title: "Success",
                                text: data.message,
                                icon: "success",
                                confirmButtonText: "OK",
                            }).then(() => location.reload());
                        })
                        .catch(error => {
                            console.error("Error deleting sub-folder:", error);
                            Swal.fire({
                                title: "Error",
                                text: "Failed to delete sub-folder.",
                                icon: "error",
                                confirmButtonText: "OK",
                            });
                        });
                    });
                    // Event listener untuk mengunggah file baru ke sub-folder
                    document.getElementById("addFilesBtn").addEventListener("click", () => {
                        const selectedSubFolder = subFolderSelect.value;
                        const files = addFilesInput.files;

                        if (!selectedSubFolder || files.length === 0) {
                            Swal.fire({
                                title: "Error",
                                text: "Please select a sub-folder and choose files to upload.",
                                icon: "error",
                                confirmButtonText: "OK",
                            });
                            return;
                        }

                        const formData = new FormData();
                        formData.append("addToSubFolder", selectedSubFolder);
                        Array.from(files).forEach((file) => formData.append("files", file));

                        fetch(`/activity/${activityId}/edit`, {
                            method: "POST",
                            body: formData,
                        })
                            .then((response) => response.json())
                            .then((data) => {
                                Swal.fire({
                                    title: "Success",
                                    text: data.message,
                                    icon: "success",
                                    confirmButtonText: "OK",
                                }).then(() => location.reload());
                            })
                            .catch((error) => {
                                console.error("Error adding files:", error);
                                Swal.fire({
                                    title: "Error",
                                    text: "Failed to add files.",
                                    icon: "error",
                                    confirmButtonText: "OK",
                                });
                            });
                    });

                    // Event listener untuk menyimpan perubahan
                    document.getElementById('editForm').addEventListener('submit', (e) => {
                        e.preventDefault();
                        
                        const formData = new FormData(e.target);
                        fetch(`/activity/${activityId}/edit`, {
                            method: 'POST',
                            body: formData,
                        })
                        .then(response => response.json())
                        .then(data => {
                            Swal.fire({
                                title: "Success",
                                text: data.message,
                                icon: "success",
                                confirmButtonText: "OK",
                            }).then(() => location.reload());
                        })
                        .catch(error => {
                            console.error("Error updating activity:", error);
                            Swal.fire({
                                title: "Error",
                                text: "Failed to update activity.",
                                icon: "error",
                                confirmButtonText: "OK",
                            });
                        });
                    });
                    
                });
        }
    });

    // Add new ISO
    document.getElementById('addISO').addEventListener('click', () => {
        const newISO = document.getElementById('newISO').value;
        fetch('/add_iso', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ iso: newISO })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            if (data.iso_list) {
                isoSelect.innerHTML = '';
                data.iso_list.forEach(iso => {
                    const option = document.createElement('option');
                    option.value = iso;
                    option.textContent = iso;
                    isoSelect.appendChild(option);
                });
            }
        });
    });

    // Link Add New Activity button to the selected ISO
    document.getElementById("isoSelect").addEventListener("change", () => {
        const selectedISO = document.getElementById("isoSelect").value;
        const addActivityBtn = document.getElementById("addActivityBtn");
        addActivityBtn.href = `/add?iso=${encodeURIComponent(selectedISO)}`;
    });
});


//Update fitur search
document.getElementById("searchBtn").addEventListener("click", () => {
    const query = document.getElementById("searchInput").value.trim();

    if (query) {
        fetch(`/search?query=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                const auditTableBody = document.querySelector("#auditTable tbody");
                auditTableBody.innerHTML = ""; // Clear the table
                
                if (data.length > 0) {
                    data.forEach(activity => {
                        auditTableBody.innerHTML += `
                            <tr>
                                <td>${activity.id}</td>
                                <td>${activity.activity}</td>
                                <td>${activity.date}</td>
                                <td>${activity.description}</td>
                                <td>
                                    <button class="delete-btn" data-id="${activity.id}">Delete</button>
                                    <button class="view-btn" data-id="${activity.id}">View</button>
                                    <button class="edit-btn" data-id="${activity.id}">Edit</button>  
                                </td>
                            </tr>
                        `;
                    });
                } else {
                    auditTableBody.innerHTML = `<tr><td colspan="5">No results found</td></tr>`;
                }
            })
            .catch(error => {
                console.error("Error searching files:", error);
            });
    }
});
