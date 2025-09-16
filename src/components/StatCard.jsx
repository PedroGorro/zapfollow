export default function StatCard({ icon, label, value, accent = "blue" }) {
    const accents = {
      blue: "bg-blue-50 text-blue-700 ring-blue-100",
      green: "bg-green-50 text-green-700 ring-green-100",
      purple: "bg-purple-50 text-purple-700 ring-purple-100",
      yellow: "bg-yellow-50 text-yellow-700 ring-yellow-100",
    };
  
    return (
      <div
        className={`p-5 rounded-2xl shadow-sm hover:shadow-md transition 
                    flex items-center gap-4 ring-1 ${accents[accent]} cursor-pointer`}
      >
        <div className="text-2xl">{icon}</div>
        <div>
          <p className="text-sm">{label}</p>
          <p className="text-2xl font-bold leading-6">{value}</p>
        </div>
      </div>
    );
  }
  