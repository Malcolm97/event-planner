'use client';

import Header from "../components/Header";
import Image from "next/image";
import UserProfile from "../components/UserProfile";
import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import EventsList from "../components/EventsList";

const categories = [
	{ name: "Music" },
	{ name: "Art" },
	{ name: "Food" },
	{ name: "Technology" },
	{ name: "Wellness" },
	{ name: "Comedy" },
];

export default function Home() {
	const [user, setUser] = useState<any>(null);
	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
		return () => unsubscribe();
	}, []);
	return (
		<div className="min-h-screen flex flex-col bg-[#f6f6fb]">
			<Header />
			{/* Show real-time user profile if logged in */}
			{user && (
				<div className="max-w-5xl mx-auto w-full mt-6 mb-2">
					<UserProfile userId={user.uid} />
				</div>
			)}
			{/* Hero Section */}
			<section className="w-full py-12 px-4 sm:px-8 bg-gradient-to-b from-[#e0c3fc] to-[#8ec5fc] border-b border-[#e0e7ef]">
				<div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-6">
					<h1 className="text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">
						Local Events Near You
					</h1>
					<p className="text-lg text-gray-600 max-w-2xl">
						Find concerts, festivals, workshops, and more happening in your area.
						Create memories with events that matter to you.
					</p>
					{/* Search/Filter Bar */}
					<div className="flex flex-col sm:flex-row gap-2 w-full max-w-2xl justify-center mt-2">
						<input className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Search events, artists, or venues..." />
						<select className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900">
							<option>All Dates</option>
							<option>Today</option>
							<option>This Week</option>
							<option>This Month</option>
						</select>
						<button className="rounded-lg px-6 py-2 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition">Find Events</button>
					</div>
					{/* Stats */}
					<div className="flex gap-8 mt-6 text-center justify-center">
						<div>
							<div className="text-2xl font-bold text-indigo-600">500+</div>
							<div className="text-gray-600 text-sm">Events this month</div>
						</div>
						<div>
							<div className="text-2xl font-bold text-indigo-600">50K+</div>
							<div className="text-gray-600 text-sm">Happy attendees</div>
						</div>
						<div>
							<div className="text-2xl font-bold text-indigo-600">100+</div>
							<div className="text-gray-600 text-sm">Cities covered</div>
						</div>
					</div>
				</div>
			</section>

			{/* Featured Events (now real-time) */}
			<section className="max-w-6xl mx-auto w-full py-12 px-4 sm:px-8">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
							<span>✨</span> Featured Events
						</h2>
						<p className="text-gray-500 text-sm mt-1">Discover the most popular events happening near you.</p>
					</div>
					<button className="rounded-lg px-4 py-2 bg-white border border-gray-200 text-indigo-700 font-semibold hover:bg-indigo-50 transition text-sm shadow">View All</button>
				</div>
				<EventsList />
				<div className="flex justify-center mt-8">
					<button className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow">View all Events</button>
				</div>
			</section>

			{/* Explore by Category */}
			<section className="w-full py-10 px-4 sm:px-8 bg-white border-t border-gray-100">
				<div className="max-w-5xl mx-auto">
					<h3 className="text-xl font-bold text-gray-900 mb-6">Explore by Category</h3>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 justify-center">
						{categories.map((cat) => (
							<button key={cat.name} className="px-6 py-4 rounded-xl bg-[#f6f6fb] border border-gray-200 text-gray-900 font-medium shadow hover:bg-indigo-50 transition flex flex-col items-center">
								<span className="text-base font-semibold">{cat.name}</span>
							</button>
						))}
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="w-full py-8 px-4 sm:px-8 bg-white border-t border-gray-200 mt-auto">
				<div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
					<div className="flex gap-6 mb-2 md:mb-0">
						<a href="/events" className="hover:text-indigo-600">Events</a>
						<a href="/categories" className="hover:text-indigo-600">Categories</a>
						<a href="/about" className="hover:text-indigo-600">About</a>
					</div>
					<div className="text-center">© 2025 PNG Events. All rights reserved.</div>
					<div className="flex gap-4">
						<a href="#" className="hover:text-indigo-600">Terms</a>
						<a href="#" className="hover:text-indigo-600">Privacy</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
