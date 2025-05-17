import { useState } from "react";



function AssignmentUpload() {

    const [file, setFile] = useState(null);



    // Fetch student email from local storage (assuming it's stored after login)

    const studentEmail = localStorage.getItem("studentEmail");



    const handleFileChange = (event) => {

        setFile(event.target.files[0]);

    };



    const handleSubmit = async (event) => {

        event.preventDefault();



        if (!studentEmail) {

            alert("User not logged in!");

            return;

        }



        if (!file) {

            alert("Please select a file!");

            return;

        }



        const formData = new FormData();

        formData.append("file", file);

        formData.append("student_email", studentEmail); // ✅ Send email instead of student_id



        try {

            const response = await fetch("http://localhost:5000/submit-assignment", {

                method: "POST",

                body: formData

            });



            const data = await response.json();

            console.log("Response:", data);



            if (response.ok) {

                alert("✅ Assignment submitted successfully!");

            } else {

                alert("❌ Submission failed: " + data.error);

            }

        } catch (error) {

            console.error("Error:", error);

            alert("❌ Failed to submit assignment.");

        }

    };



    return (

        <div>

            <h2>Submit Assignment</h2>

            <form onSubmit={handleSubmit}>

                <input type="file" onChange={handleFileChange} required />

                <button type="submit">Submit</button>

            </form>

        </div>

    );

}



export default AssignmentUpload;