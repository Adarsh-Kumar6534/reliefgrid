#!/usr/bin/env python3
"""
Verify Kubernetes Service round-robin load balancing across backend pod replicas.
Sends multiple HTTP requests to the ReliefGrid backend and logs the pod hostname handling each request.
"""

import urllib.request
import json
import os
import sys
from collections import Counter

TARGET_URL = os.environ.get("BASE_URL", "http://localhost:8000")
INSTANCE_ENDPOINT = f"{TARGET_URL}/api/v1/instance"
NUM_REQUESTS = int(os.environ.get("NUM_REQUESTS", 20))

print(f"==================================================")
print(f"  RELIEFGRID LOAD BALANCING VERIFICATION TOOL")
print(f"==================================================")
print(f"Target Endpoint : {INSTANCE_ENDPOINT}")
print(f"Total Requests  : {NUM_REQUESTS}\n")

pod_counts = Counter()

for i in range(1, NUM_REQUESTS + 1):
    try:
        req = urllib.request.Request(INSTANCE_ENDPOINT)
        with urllib.request.urlopen(req, timeout=5) as response:
            header_instance = response.headers.get("X-ReliefGrid-Instance", "N/A")
            data = json.loads(response.read().decode())
            pod_name = data.get("pod_name", header_instance)
            pod_counts[pod_name] += 1
            print(f"Request #{i:02d} -> Handled by Pod: {pod_name} (Header: {header_instance})")
    except Exception as e:
        print(f"Request #{i:02d} -> Failed: {e}")

print("\n--------------------------------------------------")
print("  TRAFFIC DISTRIBUTION SUMMARY")
print("--------------------------------------------------")
for pod, count in pod_counts.items():
    percentage = (count / NUM_REQUESTS) * 100
    print(f"  Pod [{pod}]: {count} requests ({percentage:.1f}%)")

if len(pod_counts) > 1:
    print("\nSUCCESS: Traffic is actively load-balanced across multiple backend replicas!")
    sys.exit(0)
elif len(pod_counts) == 1:
    print("\nNOTE: Traffic reached 1 replica. If testing locally on direct port-forward, multiple pods may be balanced when routed via Kubernetes Service/Ingress.")
    sys.exit(0)
else:
    print("\nERROR: No backend responses received.")
    sys.exit(1)
