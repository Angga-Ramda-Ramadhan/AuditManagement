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
    // Add view functionality with download
    auditTableBody.addEventListener("click", (event) => {
        if (event.target.classList.contains("view-btn")) {
            const activityId = event.target.getAttribute("data-id");
    
            fetch(`/activity/${activityId}/subactivities`)
                .then((response) => response.json())
                .then((subActivities) => {
                    if (Array.isArray(subActivities) && subActivities.length > 0) {
                        let subActivityHTML = '<ul>';
                        subActivities.forEach((subActivity) => {
                            subActivityHTML += `<li>
                                <strong>${subActivity.name}</strong>
                                <ul>
                                    ${subActivity.files.map(file => `
                                        <li>
                                            ${file}
                                            <button class="download-btn" data-id="${activityId}" data-file="${file}">Download</button>
                                        </li>
                                    `).join('')}
                                </ul>
                            </li>`;
                        });
                        subActivityHTML += '</ul>';
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
                            text: "This activity has no sub-activities.",
                            icon: "warning",
                            confirmButtonText: "OK",
                        });
                    }
                })
                .catch((error) => {
                    console.error("Error fetching sub-activities:", error);
                    Swal.fire({
                        title: "Error",
                        text: "Unable to fetch sub-activities. Please try again.",
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
});

document.addEventListener("DOMContentLoaded", function () {
    const table = document.getElementById("auditTable");

    table.addEventListener("click", function (event) {
        if (event.target.classList.contains("delete-btn")) {
            const activityId = event.target.getAttribute("data-id");

            if (confirm("Are you sure you want to delete this activity?")) {
                fetch(`/activity/${activityId}/delete`, {
                    method: "POST",
                })
                    .then((response) => response.json())
                    .then((data) => {
                        alert(data.message);
                        location.reload(); // Refresh halaman setelah delete
                    })
                    .catch((error) => console.error("Error:", error));
            }
        }
    });
});



// Tambahkan logika untuk tombol Add New Activity
document.getElementById("isoSelect").addEventListener("change", () => {
    const selectedISO = document.getElementById("isoSelect").value;
    const addActivityBtn = document.getElementById("addActivityBtn");
    addActivityBtn.href = `/add?iso=${encodeURIComponent(selectedISO)}`;
});


document.addEventListener("DOMContentLoaded", () => {
    const addActivityBtn = document.getElementById("addActivityBtn");
    if (addActivityBtn) {
        addActivityBtn.addEventListener("btn", (event) => {
            event.preventDefault();

            const selectedISO = "ISO9001"; // Contoh ISO, pastikan ini sesuai logika Anda
            if (!selectedISO) {
                alert("No ISO selected. Please select an ISO first.");
                return;
            }

            const url = `/add?iso=${encodeURIComponent(selectedISO)}`;
            window.location.href = url;
        });
    } else {
        console.error("Button with ID 'addActivityBtn' not found.");
    }
});


