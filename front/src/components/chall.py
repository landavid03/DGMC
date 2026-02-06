
from ast import USub
from datetime import datetime


logs = [
"2025-10-15T10:00:00 user=alice event=login",
"2025-10-15T10:05:00 user=bob event=upload",
"2025-10-15T10:07:00 user=alice event=view",
"2025-10-15T10:08:00 user=alice event=logout",
"2025-10-15T10:09:00 user=bob event=download",
"invalid log line here"
]

def summary(logs):
    users = {}

    for line in logs:
        entries = line.split()
        
        #Validacion de que vengan las 3 partes
        if len(entries) != 3:
            print("Error Linea incorrecta")
            continue
        
        dateP, userP, eventP = entries

        date = datetime.fromisoformat(dateP)

        if not str(userP).startswith("user=") or not str(eventP).startswith("event="):
            print("Error usuario o evento incorrecto")
            continue

        user = userP.split("=")[1]
        event = eventP.split("=")[1]

        if user == "" or event == "":
            print("Usuario o evento incorrecto")
            continue
        
        data = users.setdefault(user,{
            "total": 0,
            "events": set(),
            "ulfecha": date
            })

        data["total"] += 1
        data["events"].add(event)
        if date > data["ulfecha"]:
            data["ulfecha"] = date

    

    res = []
    for user in sorted(users):
        data = users[user]
        res.append({
            "user": user,
            "total_events": data["total"],
            "event_types": sorted(data["events"]),
            "last_activity": data["ulfecha"].isoformat()
        })
    
    return res
        

[
    {
        'user': 'alice',
        'total_events': 3,
        'event_types': ['login', 'logout', 'view'],
        'last_activity': '2025-10-15T10:00:00'
    },
    {
        'user': 'bob',
        'total_events': 2,
        'event_types': ['download', 'upload'],
        'last_activity': '2025-10-15T10:05:00'
    }
]

# test_1: Basic case — single user, sequential events
test_1 = [
    "2025-10-15T10:00:00 user=alice event=login",
    "2025-10-15T10:05:00 user=alice event=view",
    "2025-10-15T10:10:00 user=alice event=logout"
]


# test_2: Multiple users — interleaved events
test_2 = [
    "2025-10-15T09:59:00 user=bob event=start",
    "2025-10-15T10:00:00 user=alice event=login",
    "2025-10-15T10:01:00 user=bob event=upload",
    "2025-10-15T10:02:00 user=alice event=view",
    "2025-10-15T10:03:00 user=bob event=logout"
]


# test_3: Invalid and malformed lines — should be ignored gracefully
test_3 = [
    "2025-10-15T10:00:00 user=alice event=login",
    "this line is broken",
    "2025-10-15T10:01:00 user=bob upload=wrongformat",
    "2025-10-15T10:02:00 user=alice event=view",
    "invalid timestamp user=bob event=logout"
]

#[{'user': 'alice', 'total_events': 2, 'event_types': ['login', 'view'], 'last_activity': '2025-10-15T10:02:00'}]
# test_4: Duplicate event types and out-of-order timestamps
test_4 = [
    "2025-10-15T10:05:00 user=bob event=upload",
    "2025-10-15T10:00:00 user=bob event=login",
    "2025-10-15T10:02:00 user=bob event=upload",
    "2025-10-15T10:03:00 user=bob event=download"
]

#[{'user': 'bob', 'total_events': 4, 'event_types': ['download', 'login', 'upload'], 'last_activity': '2025-10-15T10:05:00'}]

# test_5: Empty, whitespace-only, and invalid input — should return empty result
test_5 = [
    "",
    "   ",
    "invalid data"
]
 


        
print(summary(test_5))

