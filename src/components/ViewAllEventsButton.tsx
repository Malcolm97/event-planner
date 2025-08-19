import Link from 'next/link';

const ViewAllEventsButton = () => {
  return (
    <Link href="/events">
      <span className="rounded-lg px-4 py-2 bg-white border border-black text-red-600 font-semibold hover:bg-yellow-300 hover:text-black transition text-sm shadow">
        View All
      </span>
    </Link>
  );
};

export default ViewAllEventsButton;
