const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: any }> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: json.error || { code: "API_ERROR", message: `HTTP Error ${res.status}` },
      };
    }
    return json;
  } catch (err: any) {
    console.error("API Request Error:", err);
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: "Failed to connect to ReliefGrid Backend API." },
    };
  }
}

// User Interfaces & API
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: "DONOR" | "VOLUNTEER" | "SHELTER" | "HOSPITAL" | "ADMIN";
  location?: string;
  created_at: string;
}

export interface Resource {
  id: number;
  owner_id: number;
  type: "FOOD" | "WATER" | "MEDICINE" | "BLOOD" | "CLOTHING" | "SHELTER" | "VOLUNTEER" | "OTHER";
  title: string;
  description?: string;
  quantity: number;
  unit: string;
  location: string;
  latitude: number;
  longitude: number;
  availability_status: "AVAILABLE" | "RESERVED" | "EXHAUSTED";
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Need {
  id: number;
  requester_id: number;
  type: "FOOD" | "WATER" | "MEDICINE" | "BLOOD" | "CLOTHING" | "SHELTER" | "VOLUNTEER" | "OTHER";
  title: string;
  description?: string;
  quantity_required: number;
  unit: string;
  location: string;
  latitude: number;
  longitude: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "PARTIALLY_MATCHED" | "MATCHED" | "CLOSED";
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: number;
  need_id: number;
  resource_id: number;
  match_score: number;
  distance: number;
  status: "PROPOSED" | "ACCEPTED" | "REJECTED" | "COMPLETED";
  reason: string[];
  created_at: string;
  need?: Need;
  resource?: Resource;
}

export interface Volunteer {
  id: number;
  user_id: number;
  skills: string;
  availability_status: "AVAILABLE" | "BUSY" | "OFFLINE";
  location: string;
  latitude: number;
  longitude: number;
  updated_at: string;
  user?: User;
}

export interface ActivityLogItem {
  id: number;
  event_type: string;
  title: string;
  description: string;
  entity_type?: string;
  entity_id?: number;
  status: string;
  created_at: string;
}

export interface GlobalSearchResult {
  query: string;
  resources: Resource[];
  needs: Need[];
  volunteers_count: number;
  organizations_count: number;
}

export interface DashboardSummaryData {
  total_resources: number;
  active_resources: number;
  total_needs: number;
  open_needs: number;
  critical_needs: number;
  successful_matches: number;
  active_volunteers: number;
  available_shelter_capacity: number;
  resources_by_type: Record<string, number>;
  needs_by_priority: Record<string, number>;
  recent_activity: Array<{
    id: number;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    status: string;
  }>;
}

export interface SystemStatusData {
  overall_status: "HEALTHY" | "DEGRADED" | "DOWN";
  uptime_seconds: number;
  environment: string;
  components: Record<string, { status: string; latency_ms: number; [key: string]: any }>;
  k8s_readiness: { liveness_probe: string; readiness_probe: string };
}
