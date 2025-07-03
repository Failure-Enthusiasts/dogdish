import React from "react";

const About = () => {
  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-md mt-10 text-black">
      <h1 className="text-3xl font-bold mb-4">About DogDish</h1>
      <p className="mb-4">
        <strong>DogDish</strong> is a project by Aldrick, Ronny, and Bradley. 
        Our mission with this project is to make it easy for everyone at datadog and beyondto see, plan, and understand our catered meals.
      </p>
      <p className="mb-2">≈
        <strong>Features:</strong>
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>Browse current, upcoming and past catered cuisine menus</li>
        <li>See detailed menu items and cuisine types</li>
        <li>Easy navigation and beautiful design</li>
        <li>Review and rate system for us to better understand which cuisines are most popular</li>
      </ul>
      <p>
        Thank you for using DogDish! If you have feedback or suggestions, feel free to reach out.
      </p>
    </div>
  );
};

export default About;
