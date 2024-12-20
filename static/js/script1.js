function showUpdateForm(subId) {
    document.getElementById('updateForm').style.display = 'block';
    const form = document.getElementById('updateSubActivityForm');
    form.onsubmit = function (event) {
        event.preventDefault();

        const updatedName = document.getElementById('updatedName').value;
        const updatedDate = document.getElementById('updatedDate').value;
        const newFiles = document.getElementById('newFiles').files;

        const formData = new FormData();
        formData.append('updatedName', updatedName);
        formData.append('updatedDate', updatedDate);
        for (let file of newFiles) {
            formData.append('files', file);
        }

        fetch(`/sub_activity/${subId}/update`, {
            method: 'POST',
            body: formData,
        })
            .then(response => response.json())
            .then(result => {
                if (result.status === 'success') {
                    alert(result.message);
                    window.location.href = `/activity/${subId}/sub_activities`;
                } else {
                    alert(result.message);
                }
            })
            .catch(error => console.error('Error updating sub-activity:', error));
    };
}

function hideUpdateForm() {
    document.getElementById('updateForm').style.display = 'none';
}

function handleResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
}


// Handle form submission
document.getElementById("addSubActivityForm").addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent traditional form submission
    
    const formData = new FormData(event.target); // Get form data

    // Send data to the server
    try {
        const response = await fetch('/sub_activity/<int:activity_id>', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            // Show success popup
            Swal.fire({
                title: 'Success!',
                text: result.message,
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                // Redirect to index page after confirmation
                window.location.href = '/sub_activity/<int:activity_id>';
            });
        } else {
            // Show error popup
            Swal.fire({
                title: 'Error!',
                text: result.message || 'An error occurred while adding the activity.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        console.error("Error submitting form:", error);
        Swal.fire({
            title: 'Error!',
            text: 'Something went wrong! Please try again.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
});

// Handle adding a sub-activity
document.getElementById("addSubActivityForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    try {
        const response = await fetch(window.location.href, {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        if (response.ok) {
            Swal.fire({
                title: "Success!",
                text: result.message,
                icon: "success",
                confirmButtonText: "OK",
            }).then(() => {
                window.location.reload(); // Reload page to show updated data
            });
        } else {
            Swal.fire({
                title: "Error!",
                text: result.message || "Failed to add sub-activity.",
                icon: "error",
                confirmButtonText: "OK",
            });
        }
    } catch (error) {
        Swal.fire({
            title: "Error!",
            text: "An error occurred while processing your request.",
            icon: "error",
            confirmButtonText: "OK",
        });
    }
});

// Delete a file from a sub-activity
async function deleteFile(subActivityId, fileName) {
    const confirmation = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
    });

    if (confirmation.isConfirmed) {
        try {
            const response = await fetch(`/sub_activity/${subActivityId}/delete_file`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ file: fileName }),
            });

            const result = await response.json();

            if (response.ok) {
                Swal.fire({
                    title: "Deleted!",
                    text: result.message,
                    icon: "success",
                    confirmButtonText: "OK",
                }).then(() => {
                    window.location.reload();
                });
            } else {
                Swal.fire({
                    title: "Error!",
                    text: result.message || "Failed to delete file.",
                    icon: "error",
                    confirmButtonText: "OK",
                });
            }
        } catch (error) {
            Swal.fire({
                title: "Error!",
                text: "An error occurred while processing your request.",
                icon: "error",
                confirmButtonText: "OK",
            });
        }
    }
}

// Delete a sub-activity
async function deleteSubActivity(subActivityId) {
    const confirmation = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
    });

    if (confirmation.isConfirmed) {
        try {
            const response = await fetch(`/sub_activity/${subActivityId}/delete`, {
                method: "POST",
            });

            const result = await response.json();

            if (response.ok) {
                Swal.fire({
                    title: "Deleted!",
                    text: result.message,
                    icon: "success",
                    confirmButtonText: "OK",
                }).then(() => {
                    window.location.reload();
                });
            } else {
                Swal.fire({
                    title: "Error!",
                    text: result.message || "Failed to delete sub-activity.",
                    icon: "error",
                    confirmButtonText: "OK",
                });
            }
        } catch (error) {
            Swal.fire({
                title: "Error!",
                text: "An error occurred while processing your request.",
                icon: "error",
                confirmButtonText: "OK",
            });
        }
    }
}

function hideUpdateForm() {
    document.getElementById("updateForm").style.display = "none";
}