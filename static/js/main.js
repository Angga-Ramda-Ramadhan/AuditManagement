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
