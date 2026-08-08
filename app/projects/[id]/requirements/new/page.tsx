import Link from "next/link";

export default function NewRequirementPage() {
  return (
    <div>
        <h1 className="text-3xl font-semibold">
          Create Requirement
        </h1>

        <p className="mt-2 text-slate-400">
          Add a new project requirement.
        </p>

        <form className="mt-10 space-y-6">

          {/* Requirement Number */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Requirement Number
            </label>

            <input
              disabled
              placeholder="Generated automatically"
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-slate-400"
            />
          </div>

          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Title
            </label>

            <input
              type="text"
              placeholder="Enter a short requirement title"
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

            <textarea
              rows={5}
              placeholder="Describe the requirement in detail..."
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
            />
          </div>

          {/* Priority / Status */}
          <div className="grid gap-6 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium">
                Priority
              </label>

              <select className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Status
              </label>

              <input
                disabled
                value="Draft"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-slate-400"
              />
            </div>

          </div>

          {/* Category / Source */}
          <div className="grid gap-6 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium">
                Category
              </label>

              <select className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3">
                <option>Select category...</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Source
              </label>

              <select className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3">
                <option>Select source...</option>
              </select>
            </div>

          </div>

          {/* Verification Method */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Verification Method
            </label>

            <input
              type="text"
              placeholder="Inspection, calculation, simulation, test..."
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4">

            <button
              type="submit"
              className="rounded-lg bg-cyan-600 px-6 py-3 font-medium text-white hover:bg-cyan-500"
            >
              Save Requirement
            </button>

            <Link
              href=".."
              className="rounded-lg border border-white/10 px-6 py-3 hover:bg-white/10"
            >
              Cancel
            </Link>

          </div>

        </form>

    </div>
  );
}