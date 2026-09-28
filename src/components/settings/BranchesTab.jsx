import React, { useState } from 'react';
import { Plus, MapPin, Users, Phone, Mail, Building, MoreHorizontal, Edit2, Trash2, CheckCircle2 } from 'lucide-react';

const initialBranches = [
  {
    id: 1,
    name: 'Mumbai Corporate Headquarters',
    code: 'BOM-HQ',
    tag: 'Head Office',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    manager: 'Rajesh Kumar Chhaya',
    managerRole: 'Managing Director',
    email: 'mumbai@chhayainternational.com',
    phone: '+91 22 2847 9900',
    address: '402, Trade Square, Sakinaka, Andheri East, Mumbai, MH 400072',
    staffCount: 32,
    activeCandidates: 950,
    status: 'Active',
  },
  {
    id: 2,
    name: 'Delhi NCR Regional Hub',
    code: 'DEL-02',
    tag: 'Regional Branch',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    manager: 'Vikas Sharma',
    managerRole: 'Regional Operations Manager',
    email: 'delhi@chhayainternational.com',
    phone: '+91 11 4152 8870',
    address: 'Suite 204, Ansal Tower, Nehru Place, New Delhi 110019',
    staffCount: 12,
    activeCandidates: 380,
    status: 'Active',
  },
  {
    id: 3,
    name: 'Kochi Southern Processing Center',
    code: 'COK-03',
    tag: 'Regional Branch',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    manager: 'Sunil Panicker',
    managerRole: 'Branch Head & Sourcing Lead',
    email: 'kochi@chhayainternational.com',
    phone: '+91 484 235 6670',
    address: '3rd Floor, Express House, MG Road, Ernakulam, Kochi, KL 682016',
    staffCount: 8,
    activeCandidates: 210,
    status: 'Active',
  },
  {
    id: 4,
    name: 'Dubai Overseas Liaison Office',
    code: 'DXB-INT',
    tag: 'Overseas Liaison',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
    manager: 'Farooq Al-Marzouqi',
    managerRole: 'GCC Client Relations Director',
    email: 'dubai@chhayainternational.com',
    phone: '+971 4 398 2210',
    address: 'Office 701, Al Riqqa Building, Deira, Dubai, UAE',
    staffCount: 4,
    activeCandidates: 140,
    status: 'Active',
  },
];

const BranchesTab = () => {
  const [branches, setBranches] = useState(initialBranches);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBranch, setNewBranch] = useState({
    name: '',
    code: '',
    tag: 'Regional Branch',
    manager: '',
    email: '',
    phone: '',
    address: '',
  });

  const handleAddBranch = (e) => {
    e.preventDefault();
    if (!newBranch.name) return;
    const branch = {
      id: branches.length + 1,
      name: newBranch.name,
      code: newBranch.code || `BRN-0${branches.length + 1}`,
      tag: newBranch.tag,
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      manager: newBranch.manager || 'Unassigned',
      managerRole: 'Branch In-Charge',
      email: newBranch.email || 'branch@chhayainternational.com',
      phone: newBranch.phone || '+91 99000 11223',
      address: newBranch.address || 'Commercial Center',
      staffCount: 1,
      activeCandidates: 0,
      status: 'Active',
    };
    setBranches([...branches, branch]);
    setShowAddModal(false);
    setNewBranch({ name: '', code: '', tag: 'Regional Branch', manager: '', email: '', phone: '', address: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h4 className="font-bold text-gray-900 text-[16px]">Branches & Overseas Liaison Offices</h4>
          <p className="text-[12px] text-gray-500">Manage multi-city branch offices, regional leadership, and local candidate throughput.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Branch Office
        </button>
      </div>

      {/* Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {branches.map((b) => (
          <div key={b.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {b.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${b.tagColor}`}>
                      {b.tag}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-[16px] mt-2 leading-snug">{b.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> {b.status}
                  </span>
                </div>
              </div>

              {/* Branch Head Card */}
              <div className="bg-gray-50/80 rounded-lg p-3 border border-gray-100 my-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Branch Leadership</div>
                <div className="text-[13px] font-bold text-gray-900 mt-0.5">{b.manager}</div>
                <div className="text-[11px] text-gray-500">{b.managerRole}</div>
              </div>

              {/* Contact Details */}
              <div className="space-y-2 text-[12px] text-gray-600">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-gray-700">{b.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-700 font-mono text-[11px]">{b.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-700">{b.phone}</span>
                </div>
              </div>
            </div>

            {/* Bottom Metrics & Actions */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4 text-[12px]">
                <div>
                  <span className="text-gray-400 text-[10px] block">STAFF</span>
                  <span className="font-bold text-gray-900">{b.staffCount}</span>
                </div>
                <div className="h-6 w-px bg-gray-200" />
                <div>
                  <span className="text-gray-400 text-[10px] block">CANDIDATES</span>
                  <span className="font-bold text-gray-900">{b.activeCandidates}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button title="Edit Branch" className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-md">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button title="Deactivate" className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-md">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Branch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-900 text-[16px]">Add New Branch Office</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
            </div>
            <form onSubmit={handleAddBranch} className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Branch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyderabad Sourcing Office"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Branch Code</label>
                  <input
                    type="text"
                    placeholder="HYD-04"
                    value={newBranch.code}
                    onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Type</label>
                  <select
                    value={newBranch.tag}
                    onChange={(e) => setNewBranch({ ...newBranch, tag: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option>Regional Branch</option>
                    <option>Liaison Office</option>
                    <option>Processing Hub</option>
                    <option>Training Center</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Branch In-Charge / Manager</label>
                <input
                  type="text"
                  placeholder="Full name of manager"
                  value={newBranch.manager}
                  onChange={(e) => setNewBranch({ ...newBranch, manager: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="branch@chhayainternational.com"
                    value={newBranch.email}
                    onChange={(e) => setNewBranch({ ...newBranch, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 40 2345 6789"
                    value={newBranch.phone}
                    onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Office address, city, state, pin"
                  value={newBranch.address}
                  onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-medium hover:bg-blue-700 shadow-sm"
                >
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchesTab;
