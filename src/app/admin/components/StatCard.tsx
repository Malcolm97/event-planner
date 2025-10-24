export default function StatCard({ title, count }: { title: string; count: number }) {
  return (
    <div className="p-4 bg-white shadow rounded-lg text-center">
      <h3 className="text-gray-600">{title}</h3>
      <p className="text-3xl font-semibold">{count}</p>
    </div>
  )
}
