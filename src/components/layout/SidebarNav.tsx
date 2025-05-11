
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Users,
  FileText,
  Truck,
  Receipt,
  BarChart3,
  ChevronRight,
  ChevronDown,
  MapPin,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  isOpen: boolean;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  subItems?: NavSubItem[];
}

interface NavSubItem {
  title: string;
  href: string;
}

export const SidebarNav = ({ isOpen }: SidebarNavProps) => {
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    interventions: true,
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups({
      ...expandedGroups,
      [group]: !expandedGroups[group],
    });
  };

  const navItems: NavItem[] = [
    {
      title: "Tableau de bord",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Interventions",
      href: "#",
      icon: ClipboardList,
      subItems: [
        { title: "Liste des interventions", href: "/admin/interventions" },
        { title: "Nouvelle intervention", href: "/admin/interventions/new" },
        { title: "Demandes en attente", href: "/admin/intervention-requests" },
      ],
    },
    {
      title: "Calendrier",
      href: "/admin/calendar",
      icon: Calendar,
    },
    {
      title: "Équipes",
      href: "/admin/teams",
      icon: Users,
    },
    {
      title: "Matériel",
      href: "/admin/equipment",
      icon: Wrench,
    },
    {
      title: "PV d'interventions",
      href: "/admin/reports",
      icon: FileText,
    },
    {
      title: "Logistique",
      href: "/admin/logistics",
      icon: Truck,
    },
    {
      title: "Facturation",
      href: "/admin/billing",
      icon: Receipt,
    },
    {
      title: "Statistiques",
      href: "/admin/statistics",
      icon: BarChart3,
    },
    {
      title: "Mappemonde",
      href: "/admin/world-map",
      icon: MapPin,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 z-20",
        isOpen ? "w-64" : "w-0 -ml-64"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="py-6 px-4 border-b border-sidebar-border">
          <h2 className="text-xl font-bold">Airblio</h2>
          <p className="text-sm opacity-70">Gestion des interventions</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.title}>
                {item.subItems ? (
                  <div className="flex flex-col">
                    <button
                      onClick={() => toggleGroup(item.title.toLowerCase())}
                      className={cn(
                        "flex items-center w-full px-3 py-2 rounded-md hover:bg-sidebar-accent group",
                        isActive(item.href) && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      <span className="flex-1 text-left">{item.title}</span>
                      {expandedGroups[item.title.toLowerCase()] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {expandedGroups[item.title.toLowerCase()] && (
                      <ul className="mt-1 pl-10 space-y-1">
                        {item.subItems.map((subItem) => (
                          <li key={subItem.title}>
                            <Link
                              to={subItem.href}
                              className={cn(
                                "block py-2 px-2 rounded-md hover:bg-sidebar-accent text-sm",
                                isActive(subItem.href) &&
                                  "bg-sidebar-accent text-sidebar-accent-foreground"
                              )}
                            >
                              {subItem.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md hover:bg-sidebar-accent group",
                      isActive(item.href) && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span>{item.title}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground">
              AD
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Admin</p>
              <p className="text-xs opacity-70">admin@exemple.fr</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
