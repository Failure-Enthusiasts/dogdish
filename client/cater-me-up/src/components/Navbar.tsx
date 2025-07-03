import React from "react";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="w-full flex items-center justify-between px-6 py-4 shadow-md bg-gray-50">
      <div className="font-bold pl-10 text-xl text-gray-800">
        <Link href="/" className="hover:underline cursor-pointer">DogDish</Link>
      </div>
      <ul className="flex space-x-6 pr-10 text-gray-700">
        <li>
        <Link href="/all-events" className="hover:underline cursor-pointer">All Events</Link>
        </li>
        <li>
        <Link href="/about" className="hover:underline cursor-pointer">About</Link>
        </li>
        <li>
        <Link href="/admin" className="hover:underline cursor-pointer">Admin</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar; 