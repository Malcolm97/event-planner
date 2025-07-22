'use client';

import Header from "../components/Header";
import EventCard, { Event } from "../components/EventCard";
import Image from "next/image";

const events: Event[] = [
	{
		id: "1",
		name: "Summer Music Festival",
		location: "Central Park, NYC",
		price: 49.99,
		description:
			"Join us for a day of music, food, and fun in the heart of the city!",
		image: "/vercel.svg",
	},
	{
		id: "2",
		name: "Art & Wine Night",
		location: "Brooklyn Art House",
		price: 0,
		description:
			"Sip wine and paint with local artists. All materials provided.",
		image: "/next.svg",
	},
	{
		id: "3",
		name: "Tech Meetup 2025",
		location: "SoHo Tech Hub",
		price: 15.0,
		description:
			"Network with tech enthusiasts and hear from industry leaders.",
		image: "/globe.svg",
	},
];

const categories = [
	{ name: "Music" },
	{ name: "Art" },
	{ name: "Food" },
	{ name: "Technology" },
	{ name: "Wellness" },
	{ name: "Comedy" },
];

export default function Home() {
	return (
		<div className="min-h-screen flex flex-col bg-gradient-to-br from-[#e0c3fc] via-[#8ec5fc] to-[#f9f9f9] dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
			<Header />
			{/* Hero Section */}
			<section className="w-full py-12 px-4 sm:px-8 bg-gradient-to-r from-[#e0c3fc] to-[#8ec5fc] dark:from-gray-900 dark:to-gray-800">
				<div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-6">
					<h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
						Discover Amazing
					</h1>
					<p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl">
						Find concerts, festivals, workshops, and more happening in your area.
						Create memories with events that matter to you.
					</p>
					{/* Search/Filter Bar */}
					<div className="flex flex-col sm:flex-row gap-2 w-full max-w-2xl justify-center mt-2">
						<input className="rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Search events, artists, or venues..." />
						<select className="rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
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
							<div className="text-gray-700 dark:text-gray-300 text-sm">Events this month</div>
						</div>
						<div>
							<div className="text-2xl font-bold text-indigo-600">50K+</div>
							<div className="text-gray-700 dark:text-gray-300 text-sm">Happy attendees</div>
						</div>
						<div>
							<div className="text-2xl font-bold text-indigo-600">100+</div>
							<div className="text-gray-700 dark:text-gray-300 text-sm">Cities covered</div>
						</div>
					</div>
				</div>
			</section>

			{/* Featured Events */}
			<section className="max-w-6xl mx-auto w-full py-12 px-4 sm:px-8">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
							<span>✨</span> Featured Events
						</h2>
						<p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Discover the most popular events happening near you.</p>
					</div>
					<button className="rounded-lg px-4 py-2 bg-indigo-50 dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 font-semibold hover:bg-indigo-100 dark:hover:bg-gray-700 transition text-sm">View All</button>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
					{events.map((event) => (
						<EventCard key={event.id} event={event} />
					))}
				</div>
			</section>

			{/* Explore by Category */}
			<section className="w-full py-10 px-4 sm:px-8 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
				<div className="max-w-5xl mx-auto">
					<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Explore by Category</h3>
					<div className="flex flex-wrap gap-4 justify-center">
						{categories.map((cat) => (
							<button key={cat.name} className="px-6 py-2 rounded-full bg-indigo-50 dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 font-medium shadow hover:bg-indigo-100 dark:hover:bg-gray-700 transition">
								{cat.name}
							</button>
						))}
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="w-full py-8 px-4 sm:px-8 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 mt-auto">
				<div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 dark:text-gray-400 text-sm">
					<div className="flex gap-6 mb-2 md:mb-0">
						<a href="#" className="hover:text-indigo-600">Events</a>
						<a href="#" className="hover:text-indigo-600">Categories</a>
						<a href="#" className="hover:text-indigo-600">About</a>
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
