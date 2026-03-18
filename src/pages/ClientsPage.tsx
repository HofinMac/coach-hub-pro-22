import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { AvatarCircle } from "@/components/AvatarCircle";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search } from "lucide-react";
import { getClientsByCoach, type ClientStatus } from "@/lib/demo-data";

const COACH_ID = "c1";
const filterOptions: (ClientStatus | 'all')[] = ['all', 'active', 'at_risk', 'inactive', 'lead'];

export default function ClientsPage() {
  const allClients = getClientsByCoach(COACH_ID);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');

  const filtered = allClients
    .filter(c => statusFilter === 'all' || c.status === statusFilter)
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Clients" description={`${allClients.length} total clients`}>
        <Button size="sm" className="gap-1.5"><UserPlus className="h-3.5 w-3.5" /> Add client</Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {filterOptions.map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                statusFilter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {f === 'at_risk' ? 'At Risk' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Client List */}
      <div className="rounded-xl bg-card shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-subtle">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Client</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Goals</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Credits</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(client => (
              <tr key={client.id} className="hover:bg-subtle transition-colors group">
                <td className="px-4 py-3">
                  <Link to={`/clients/${client.id}`} className="flex items-center gap-3">
                    <AvatarCircle initials={client.avatar} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.email}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <StatusBadge status={client.status} />
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <p className="text-sm text-muted-foreground truncate max-w-[200px]">{client.goals}</p>
                </td>
                <td className="px-4 py-3 text-right hidden lg:table-cell">
                  <span className="text-sm font-mono tabular-nums text-foreground">{client.packageCredits}</span>
                </td>
                <td className="px-4 py-3 text-right hidden lg:table-cell">
                  <span className="text-sm text-muted-foreground">{client.lastActivity}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">No clients found.</p>
        )}
      </div>
    </div>
  );
}
