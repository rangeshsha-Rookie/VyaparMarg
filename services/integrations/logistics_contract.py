"""Integration Contract with Student 2: Shivam (Smart Rural Logistics Planner).

Defines the contract to compare rural transport options, predict delivery
costs, and group nearby orders without absorbing the logistics module.
"""

from __future__ import annotations

from typing import Any


def calculate_logistics_quote(
    origin_district: str,
    destination_district: str,
    weight_kg: float,
    cargo_type: str = "general",
) -> dict[str, Any]:
    """Provide estimated transport options and delivery cost comparison across rural Maharashtra."""
    # Distance estimation factor between Maharashtra districts
    is_same_district = origin_district.strip().lower() == destination_district.strip().lower()
    base_dist_km = 45.0 if is_same_district else 220.0

    carriers = [
        {
            "carrier_name": "Rural Pickup (Mahindra Bolero Maxi Truck)",
            "vehicle_type": "Pickup Truck",
            "capacity_kg": 1500,
            "estimated_cost_inr": round(max(350, base_dist_km * 18 + weight_kg * 1.5), 2),
            "estimated_delivery_hours": 12 if is_same_district else 36,
            "best_for": "Bulk farm produce, jaggery, grains, and wholesale goods",
            "rural_doorstep_pickup": True,
        },
        {
            "carrier_name": "Local 3-Wheeler Tempo (Ape / Piaggio)",
            "vehicle_type": "3-Wheeler Cargo",
            "capacity_kg": 500,
            "estimated_cost_inr": round(max(200, base_dist_km * 12 + weight_kg * 1.2), 2),
            "estimated_delivery_hours": 6 if is_same_district else 24,
            "best_for": "Taluka-level market distribution and retail shop replenishment",
            "rural_doorstep_pickup": True,
        },
        {
            "carrier_name": "India Post Speed Post / Parcel",
            "vehicle_type": "Postal Network",
            "capacity_kg": 35,
            "estimated_cost_inr": round(max(40, weight_kg * 45), 2),
            "estimated_delivery_hours": 48 if is_same_district else 72,
            "best_for": "Packaged spices, handicrafts, and small parcels",
            "rural_doorstep_pickup": False,
        },
    ]

    return {
        "origin_district": origin_district,
        "destination_district": destination_district,
        "weight_kg": weight_kg,
        "cargo_type": cargo_type,
        "estimated_distance_km": base_dist_km,
        "available_carriers": carriers,
        "recommended_carrier": carriers[0]["carrier_name"] if weight_kg > 100 else carriers[1]["carrier_name"],
        "integrated_module": "Student 2 — Shivam (Smart Rural Logistics Planner)",
    }
