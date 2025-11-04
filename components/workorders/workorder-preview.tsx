"use client";

import { useState, useEffect } from "react";
import {
  WorkOrder,
  Client,
  ClientLocation,
  Technician,
  Material,
} from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  MapPin,
  User,
  Clock,
  AlertCircle,
  Mail,
  Phone,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getClientById } from "@/lib/supabase/clients";
import { getClientLocationById } from "@/lib/supabase/client-locations";
import { getTechnicians } from "@/lib/supabase/technicians";
import { getMaterials } from "@/lib/supabase/materials";

interface SelectedTechnician {
  technician_id: string;
  role?: string;
}

interface SelectedMaterial {
  material_id: string;
  quantity: number;
  notes?: string;
}

interface WorkOrderPreviewProps {
  data: Partial<WorkOrder>;
  technicians: SelectedTechnician[];
  materials: SelectedMaterial[];
}

const priorityConfig = {
  low: { label: "Low", color: "bg-blue-500" },
  medium: { label: "Medium", color: "bg-yellow-500" },
  high: { label: "High", color: "bg-orange-500" },
  urgent: { label: "Urgent", color: "bg-red-500" },
};

const workTypeConfig = {
  installation: "Installation",
  maintenance: "Maintenance",
  repair: "Repair",
  inspection: "Inspection",
  other: "Other",
};

export function WorkOrderPreview({
  data,
  technicians,
  materials,
}: WorkOrderPreviewProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [location, setLocation] = useState<ClientLocation | null>(null);
  const [allTechnicians, setAllTechnicians] = useState<Technician[]>([]);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);

  useEffect(() => {
    if (data.client_id) {
      loadClient(data.client_id);
    } else {
      setClient(null);
    }
  }, [data.client_id]);

  useEffect(() => {
    if (data.client_location_id) {
      loadLocation(data.client_location_id);
    } else {
      setLocation(null);
    }
  }, [data.client_location_id]);

  useEffect(() => {
    loadTechnicians();
    loadMaterials();
  }, []);

  const loadClient = async (clientId: string) => {
    try {
      const clientData = await getClientById(clientId);
      setClient(clientData);
    } catch (error) {
      console.error("Error loading client:", error);
    }
  };

  const loadLocation = async (locationId: string) => {
    try {
      const locationData = await getClientLocationById(locationId);
      setLocation(locationData);
    } catch (error) {
      console.error("Error loading location:", error);
    }
  };

  const loadTechnicians = async () => {
    try {
      const data = await getTechnicians();
      setAllTechnicians(data);
    } catch (error) {
      console.error("Error loading technicians:", error);
    }
  };

  const loadMaterials = async () => {
    try {
      const data = await getMaterials();
      setAllMaterials(data);
    } catch (error) {
      console.error("Error loading materials:", error);
    }
  };

  const priority =
    priorityConfig[data.priority as keyof typeof priorityConfig] ||
    priorityConfig.medium;
  const workType =
    workTypeConfig[data.work_type as keyof typeof workTypeConfig] || "Other";

  // Use location address if available, otherwise use manual address
  const displayAddress = location
    ? {
        address: location.address,
        city: location.city,
        state: location.state,
        zip_code: location.zip_code,
        country: location.country,
      }
    : {
        address: data.manual_address,
        city: data.manual_city,
        state: data.manual_state,
        zip_code: data.manual_zip_code,
        country: data.manual_country,
      };

  return (
    <div className="max-w-4xl mx-auto">
      {/* PDF Container - Simula una hoja de papel */}
      <Card className="bg-white shadow-2xl min-h-[297mm] p-16">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-14 w-14 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xl">M1</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold">M1 Networks</h1>
                <p className="text-sm text-muted-foreground">
                  Work Order System
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-primary mb-2">
              {data.title ? "WO-2025-XXXX" : "WO-####-####"}
            </div>
            <Badge
              variant={data.priority === "urgent" ? "destructive" : "default"}
              className="text-sm px-3 py-1"
            >
              {priority.label}
            </Badge>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Title & Description */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">
            {data.title || "No title"}
          </h2>
          {data.description && (
            <p className="text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {data.description}
            </p>
          )}
        </div>

        {/* Main Information - Grid */}
        <div className="grid grid-cols-2 gap-12 mb-10">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <AlertCircle className="h-4 w-4" />
                Work Type
              </div>
              <p className="text-xl font-semibold text-gray-800">{workType}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <User className="h-4 w-4" />
                Client
              </div>
              <p className="text-xl font-semibold text-gray-800">
                {client
                  ? client.name
                  : data.client_id
                  ? "Loading..."
                  : "No client"}
              </p>
            </div>

            {data.scheduled_date && (
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  <Calendar className="h-4 w-4" />
                  Scheduled Date
                </div>
                <p className="text-lg font-medium text-gray-800">
                  {new Date(data.scheduled_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                {(data.scheduled_start_time || data.scheduled_end_time) && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {data.scheduled_start_time || "00:00"} -{" "}
                    {data.scheduled_end_time || "00:00"}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {(displayAddress.address ||
              displayAddress.city ||
              displayAddress.state) && (
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </div>
                <div className="text-base text-gray-800">
                  {location && (
                    <p className="font-semibold text-sm mb-2 text-primary">
                      {location.location_name}
                    </p>
                  )}
                  {displayAddress.address && (
                    <p className="mb-1">{displayAddress.address}</p>
                  )}
                  {(displayAddress.city || displayAddress.state) && (
                    <p className="text-muted-foreground">
                      {displayAddress.city}
                      {displayAddress.city && displayAddress.state && ", "}
                      {displayAddress.state}
                    </p>
                  )}
                  {displayAddress.zip_code && (
                    <p className="text-muted-foreground">
                      ZIP {displayAddress.zip_code}
                    </p>
                  )}
                  {displayAddress.country && (
                    <p className="text-muted-foreground">
                      {displayAddress.country}
                    </p>
                  )}
                </div>
              </div>
            )}

            {(data.poc_name || data.poc_email || data.poc_phone) && (
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Point of Contact
                </div>
                {data.poc_name && (
                  <p className="font-semibold text-base text-gray-800">
                    {data.poc_name}
                    {data.poc_title && (
                      <span className="text-muted-foreground ml-2 text-sm font-normal">
                        • {data.poc_title}
                      </span>
                    )}
                  </p>
                )}
                <div className="mt-2 space-y-1">
                  {data.poc_email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {data.poc_email}
                    </p>
                  )}
                  {data.poc_phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {data.poc_phone}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-10" />

        {/* Assigned Technicians */}
        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-5 text-gray-800">
            Assigned Technicians
          </h3>
          {technicians.length > 0 ? (
            <div className="space-y-4">
              {technicians.map((selected) => {
                const technician = allTechnicians.find(
                  (t) => t.id === selected.technician_id
                );
                if (!technician) return null;

                return (
                  <div
                    key={technician.id}
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={technician.photo_url || undefined}
                        alt={technician.name}
                      />
                      <AvatarFallback>
                        {technician.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-base text-gray-800">
                        {technician.name}
                      </p>
                      {selected.role && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {selected.role}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-base">
              No technicians assigned
            </p>
          )}
        </div>

        {/* Materials */}
        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-5 text-gray-800">
            Materials
          </h3>
          {materials.length > 0 ? (
            <div className="border-2 border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-100 border-b-2 border-slate-200">
                  <tr>
                    <th className="text-left p-4 font-bold text-sm text-gray-700 uppercase tracking-wide">
                      Material
                    </th>
                    <th className="text-center p-4 font-bold text-sm text-gray-700 uppercase tracking-wide w-32">
                      Quantity
                    </th>
                    <th className="text-left p-4 font-bold text-sm text-gray-700 uppercase tracking-wide">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((selected) => {
                    const material = allMaterials.find(
                      (m) => m.id === selected.material_id
                    );
                    if (!material) return null;

                    return (
                      <tr
                        key={material.id}
                        className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50"
                      >
                        <td className="p-4">
                          <p className="font-semibold text-base text-gray-800">
                            {material.name}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {material.sku && `SKU: ${material.sku}`}
                          </p>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-mono text-base font-medium">
                            {selected.quantity} {material.unit_of_measure}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {selected.notes || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-base">
              No materials added
            </p>
          )}
        </div>

        <Separator className="my-10" />

        {/* Footer */}
        <div className="mt-16 pt-10 border-t-2 border-slate-200 text-center">
          <p className="text-base text-muted-foreground">
            This is a preview of the Work Order.
            {!data.title && " Complete the information in the form."}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            M1 Networks © {new Date().getFullYear()} - All rights reserved
          </p>
        </div>
      </Card>
    </div>
  );
}
