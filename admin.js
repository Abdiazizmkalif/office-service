const express = require('express');
const router = express.Router();

module.exports = (prisma) => {
    
    // 1. GET Dashboard Route
    router.get('/', async (req, res) => {
        const password = req.query.password;
        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).send("<h1>Access Denied</h1><p>You do not have permission to view this page.</p>");
        }

        try {
            const submissions = await prisma.carSubmission.findMany({
                orderBy: { id: 'desc' }
            });

            let tableRows = '';
            submissions.forEach(row => {
                const appDate = row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                }) : 'N/A';

                const postedClass = row.isPosted ? 'already-posted' : '';

                tableRows += `
                    <tr data-car-type="${(row.carType || '').toUpperCase()}" class="${postedClass}" data-id="${row.id}">
                        <td><input type="checkbox" class="student-select" data-id="${row.id}" data-name="${row.name}" data-car="${row.carType}" data-tin="${row.tinNumber || 'N/A'}" onchange="updateSelectedList()"></td>
                        <td class="cell-id">${row.id}</td>
                        <td class="student-name">${row.name}</td>
                        <td>${row.mobileNumber}</td>
                        <td>${row.carType}</td>
                        <td>${row.tinNumber || 'N/A'}</td>
                        <td class="cell-date">${appDate}</td>
                    </tr>
                `;
            });

            const htmlResponse = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Admin Dashboard - Submissions</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
                    <style>
                        :root{
                            --ink-900:#18242f;
                            --ink-700:#4b5a64;
                            --paper:#eef1ec;
                            --card:#fbfbf8;
                            --amber:#d98a2b;
                            --amber-dark:#b66f1d;
                            --green:#2f8f5b;
                            --green-dark:#24714a;
                            --line:#d8dcd4;
                        }

                        *{ box-sizing: border-box; }

                        body {
                            font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
                            margin: 0;
                            padding: 32px 36px 60px;
                            background-color: var(--paper);
                            color: var(--ink-900);
                        }

                        h1 {
                            margin: 0 0 4px;
                            font-family: 'Oswald', sans-serif;
                            font-weight: 600;
                            font-size: 24px;
                            letter-spacing: 0.01em;
                        }

                        .page-eyebrow {
                            font-family: 'IBM Plex Mono', monospace;
                            font-size: 11px;
                            letter-spacing: 0.12em;
                            text-transform: uppercase;
                            color: var(--amber-dark);
                            margin: 0 0 6px;
                        }

                        .page-header { margin-bottom: 26px; }

                        .minimal-bar {
                            background: var(--card);
                            padding: 16px 22px;
                            border-radius: 10px;
                            box-shadow: 0 2px 10px rgba(24,36,47,0.06);
                            border: 1px solid var(--line);
                            margin-bottom: 24px;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: 20px;
                            flex-wrap: wrap;
                        }

                        .filter-group { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
                        .filter-group label {
                            font-family: 'IBM Plex Mono', monospace;
                            font-size: 11px;
                            letter-spacing: 0.06em;
                            text-transform: uppercase;
                            color: var(--ink-700);
                        }

                        select, input[type="date"] {
                            padding: 9px 12px;
                            border: 1.5px solid var(--line);
                            border-radius: 6px;
                            font-size: 14px;
                            font-family: 'IBM Plex Sans', sans-serif;
                            color: var(--ink-900);
                            background: #fff;
                            outline: none;
                            transition: border-color .15s ease;
                        }
                        select:focus, input[type="date"]:focus { border-color: var(--amber); }

                        .counter-wrap { display: flex; align-items: center; gap: 14px; }
                        #counter-label {
                            font-family: 'IBM Plex Mono', monospace;
                            font-size: 13px;
                            letter-spacing: 0.04em;
                            color: var(--ink-700);
                        }

                        /* Two-Column Workspace Layout to stop content pushing downwards */
                        .dashboard-layout { display: flex; gap: 28px; align-items: flex-start; }
                        .left-panel { flex: 1; min-width: 0; }
                        .right-panel { width: 620px; position: sticky; top: 20px; flex-shrink: 0; }

                        .data-table {
                            width: 100%;
                            border-collapse: collapse;
                            background: var(--card);
                            box-shadow: 0 2px 10px rgba(24,36,47,0.06);
                            border-radius: 10px;
                            overflow: hidden;
                            border: 1px solid var(--line);
                        }
                        .data-table th, .data-table td {
                            padding: 12px 14px;
                            text-align: left;
                            border-bottom: 1px solid var(--line);
                            font-size: 14px;
                        }
                        .data-table th {
                            background-color: var(--ink-900);
                            color: #fff;
                            font-family: 'IBM Plex Mono', monospace;
                            font-size: 11px;
                            letter-spacing: 0.08em;
                            text-transform: uppercase;
                            font-weight: 500;
                        }
                        .data-table .cell-id, .data-table .cell-date { font-family: 'IBM Plex Mono', monospace; color: var(--ink-700); font-size: 13px; }
                        .data-table .student-name { font-weight: 600; }

                        .data-table tbody tr:nth-child(even) { background-color: rgba(24,36,47,0.025); }

                        tr.selected-row { background-color: rgba(47,143,91,0.12) !important; }
                        tr.selected-row .student-name { color: var(--green-dark); }
                        tr.already-posted { background-color: rgba(75,90,100,0.07) !important; color: #8a9298; }
                        tr.already-posted td { border-bottom: 1px solid var(--line); }
                        tr:hover { background-color: rgba(217,138,43,0.07); }

                        .btn {
                            display: inline-block;
                            padding: 10px 18px;
                            background: var(--green);
                            color: white;
                            text-decoration: none;
                            border-radius: 6px;
                            border: none;
                            cursor: pointer;
                            font-family: 'Oswald', sans-serif;
                            font-size: 13px;
                            font-weight: 600;
                            letter-spacing: 0.04em;
                            text-transform: uppercase;
                            transition: transform .15s ease, background .15s ease, box-shadow .15s ease;
                            box-shadow: 0 6px 14px -6px rgba(47,143,91,0.55);
                        }
                        .btn:hover { background: var(--green-dark); transform: translateY(-1px); }
                        .btn:active { transform: translateY(0); }

                        /* --- CARDS FOR SCREENSHOTS --- */
                        .preview-container { display: none; }
                        .preview-card {
                            position: relative;
                            width: 600px;
                            background: #ffffff;
                            border: 2px solid var(--ink-900);
                            border-radius: 10px;
                            padding: 30px;
                            box-shadow: 0 10px 30px -10px rgba(24,36,47,0.3);
                            box-sizing: border-box;
                        }
                        .preview-label {
                            margin: 0 0 10px;
                            font-family: 'IBM Plex Mono', monospace;
                            font-size: 12px;
                            letter-spacing: 0.06em;
                            text-transform: uppercase;
                            color: var(--ink-700);
                        }

                        .seal {
                            position: absolute;
                            top: -22px;
                            right: -22px;
                            width: 72px;
                            height: 72px;
                            transform: rotate(-10deg);
                            filter: drop-shadow(0 5px 9px rgba(0,0,0,0.2));
                        }

                        .card-header { position: relative; border-bottom: 2px dashed var(--amber); padding-bottom: 15px; margin-bottom: 20px; padding-right: 60px; }
                        .card-header .eyebrow {
                            margin: 0 0 6px;
                            font-family: 'IBM Plex Mono', monospace;
                            font-size: 11px;
                            letter-spacing: 0.1em;
                            text-transform: uppercase;
                            color: var(--amber-dark);
                            text-align: center;
                        }
                        .card-header h2 {
                            margin: 0 0 10px 0;
                            color: var(--ink-900);
                            font-family: 'Oswald', sans-serif;
                            font-weight: 600;
                            font-size: 23px;
                            text-align: center;
                            text-transform: uppercase;
                            letter-spacing: 0.04em;
                        }
                        .meta-info { font-size: 15px; line-height: 1.7; margin: 0; padding-left: 5px; color: var(--ink-900); }

                        .manifest-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14.5px; }
                        .manifest-table th {
                            background-color: var(--paper);
                            color: var(--ink-900);
                            font-family: 'IBM Plex Mono', monospace;
                            font-size: 11px;
                            letter-spacing: 0.06em;
                            text-transform: uppercase;
                            border-top: 2px solid var(--ink-900);
                            border-bottom: 2px solid var(--ink-900);
                        }
                        .manifest-table th, .manifest-table td { padding: 6px 8px; text-align: left; }
                        .manifest-table td { border-bottom: 1px solid var(--line); color: var(--ink-900); }
                        .manifest-table tr:last-child td { border-bottom: 2px solid var(--ink-900); }

                        .card-footer { background: var(--paper); border-left: 4px solid var(--green); padding: 15px 16px; border-radius: 4px; margin-top: 25px; }
                        .card-footer p { margin: 0; font-size: 14.5px; line-height: 1.7; font-weight: 500; color: var(--ink-900); }
                    </style>
                </head>
                <body>
                    <div class="page-header">
                        <p class="page-eyebrow">Road &amp; Transport Authority · Admin</p>
                        <h1>Exam Form Submissions Dashboard</h1>
                    </div>
                    
                    <div class="minimal-bar">
                        <div class="filter-group">
                            <label for="carFilter">Type</label>
                            <select id="carFilter" onchange="filterTable()">
                                <option value="all">All License Categories</option>
                                <option value="AUTOMOBILE">AUTOMOBILE</option>
                                <option value="PASSENGER">PASSENGER ONE (R1)</option>
                                <option value="DRY CARGO">DRY CARGO ONE (D1)</option>
                                <option value="THREE CYCLE">THREE CYCLE</option>
                            </select>

                            <label for="examDate">Exam Date</label>
                            <input type="date" id="examDate" onchange="updateSelectedList()">
                        </div>

                        <div class="counter-wrap">
                            <span id="counter-label">Selected: 0</span>
                            <button id="markPostedBtn" class="btn" style="display:none;" onclick="submitPostedStatus()">Mark as Posted ✓</button>
                        </div>
                    </div>

                    <div class="dashboard-layout">
                        
                        <div class="left-panel">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th style="width: 40px;">Select</th>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Mobile Number</th>
                                        <th>Car Type</th>
                                        <th>TIN Number</th>
                                        <th>Submission Date</th>
                                    </tr>
                                </thead>
                                <tbody id="tableBody">
                                    ${tableRows || '<tr><td colspan="7" style="text-align:center;">No submissions found yet.</td></tr>'}
                                </tbody>
                            </table>
                        </div>

                        <div class="right-panel">
                            <div class="preview-container" id="previewContainer">
                                <h3 class="preview-label">Ready for Screenshot</h3>
                                <div class="preview-card" id="postCard">
                                    <svg class="seal" viewBox="0 0 100 100" aria-hidden="true">
                                        <defs>
                                            <path id="sealArcTop" d="M 12 50 A 38 38 0 1 1 88 50" />
                                        </defs>
                                        <circle cx="50" cy="50" r="46" fill="none" stroke="#d98a2b" stroke-width="2"/>
                                        <circle cx="50" cy="50" r="38" fill="none" stroke="#d98a2b" stroke-width="1"/>
                                        <text font-family="IBM Plex Mono, monospace" font-size="6.3" fill="#d98a2b" letter-spacing="1.5">
                                            <textPath href="#sealArcTop" startOffset="2">EXAM &amp; LICENSING DIVISION</textPath>
                                        </text>
                                        <text font-family="Oswald, sans-serif" font-size="11" font-weight="600" fill="#d98a2b" text-anchor="middle">
                                            <tspan x="50" y="48">Theory</tspan>
                                            <tspan x="50" y="60">TEST</tspan>
                                        </text>
                                    </svg>

                                    <div class="card-header">
                                        <p class="eyebrow">Road &amp; Transport Authority</p>
                                        <h2>Exam Schedule Notice</h2>
                                        <p class="meta-info">
                                            🗓 <strong>Date:</strong> <span id="view-date"></span><br>
                                            ⏰ <strong>Time:</strong> 8:00 In the morning (subaxnimo)<br>
                                            📍 <strong>Location:</strong> Xafiiska Gaadiidka Iyo Ganacsiga
                                        </p>
                                    </div>
                                    
                                    <table class="manifest-table">
                                        <thead>
                                            <tr>
                                                <th style="width: 10%;">No.</th>
                                                <th style="width: 50%;">Full Name</th>
                                                <th style="width: 25%;">TIN Number</th>
                                                <th style="width: 15%;">Type</th>
                                            </tr>
                                        </thead>
                                        <tbody id="manifestBody">
                                            </tbody>
                                    </table>
                                    
                                    <div class="card-footer">
                                        <p id="view-ethio-note"></p>
                                        <p style="margin-top: 8px; color: #155724;">ፈተና ነናችሁና 2 ሰአት ትራንስፖርትና ንግድ ቢሮ ሂዱና ተፈተኑ፡፡</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <script>
                        document.getElementById('examDate').valueAsDate = new Date();
                        var currentSelectedIds = [];

                        function filterTable() {
                            var selectedValue = document.getElementById('carFilter').value;
                            var rows = document.querySelectorAll('#tableBody tr');
                            
                            rows.forEach(function(row) {
                                var rowCarType = row.getAttribute('data-car-type') || '';
                                if (selectedValue === 'all' || rowCarType.indexOf(selectedValue) !== -1) {
                                    row.style.display = '';
                                } else {
                                    row.style.display = 'none';
                                }
                            });
                        }

                        function getEthiopianDate(gregorianDateStr) {
                            if (!gregorianDateStr) return { day: 1, month: 1, year: 2018, weekdayAmh: '', weekdaySom: '', weekdayEng: '' };
                            
                            var date = new Date(gregorianDateStr);
                            
                            // Day of the week arrays
                            var nativeWeekdaysEng = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
                            var weekdaysAmh = ['እሁድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'አርብ', 'ቅዳሜ'];
                            var weekdaysSom = ['axada', 'isniinta', 'talaadada', 'arbacada', 'khamiista', 'jimcaha', 'sabtida'];
                            var weekdayIdx = date.getDay();

                            // 1. Calculate Julian Day Number from Gregorian Date
                            var year = date.getFullYear();
                            var month = date.getMonth() + 1;
                            var day = date.getDate();
                            
                            if (month <= 2) {
                                year -= 1;
                                month += 12;
                            }
                            var A = Math.floor(year / 100);
                            var B = Math.floor(A / 4);
                            var C = 2 - A + B;
                            var E = Math.floor(365.25 * (year + 4716));
                            var F = Math.floor(30.6001 * (month + 1));
                            var jd = C + day + E + F - 1524.5;

                            // 2. Calculate Ethiopian Date from the Julian Day Number
                            var r = (jd - 1723856) % 1461;
                            var n = (r % 365) + 365 * Math.floor(r / 1460);
                            
                            var ethYear = 4 * Math.floor((jd - 1723856) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
                            var ethMonth = Math.floor(n / 30) + 1;
                            var ethDay = (n % 30) + 1;
                            
                            // Safeguard edge case for the end of a 30-day month mapping
                            if (ethMonth === 14) {
                                ethMonth = 13;
                                ethDay = 6;
                            }

                            var months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

                            return {
                                day: ethDay, 
                                month: ethMonth, // Will perfectly map 1 through 13
                                year: ethYear,   // Will perfectly stay 2018 E.C. right now
                                weekdayAmh: weekdaysAmh[weekdayIdx],
                                weekdaySom: weekdaysSom[weekdayIdx],
                                weekdayEng: nativeWeekdaysEng[weekdayIdx],
                                engMonthName: months[date.getMonth()], 
                                engDay: date.getDate(), 
                                engYear: date.getFullYear()
                            };
                        }

                        function updateSelectedList() {
                            var checkboxes = document.querySelectorAll('.student-select');
                            var selectedStudents = [];
                            currentSelectedIds = [];

                            checkboxes.forEach(function(cb) {
                                var row = cb.closest('tr');
                                var sId = cb.getAttribute('data-id');
                                if (cb.checked) {
                                    row.classList.add('selected-row');
                                    currentSelectedIds.push(sId);
                                    selectedStudents.push({
                                        name: cb.getAttribute('data-name'),
                                        car: cb.getAttribute('data-car'),
                                        tin: cb.getAttribute('data-tin')
                                    });
                                } else {
                                    row.classList.remove('selected-row');
                                }
                            });

                            document.getElementById('counter-label').innerText = 'Selected: ' + selectedStudents.length;
                            
                            var markBtn = document.getElementById('markPostedBtn');
                            var container = document.getElementById('previewContainer');
                            
                            if (selectedStudents.length === 0) {
                                container.style.display = 'none';
                                markBtn.style.display = 'none';
                                return;
                            }
                            
                            container.style.display = 'block';
                            markBtn.style.display = 'inline-block';

                            var dateInput = document.getElementById('examDate').value;
                            var eth = getEthiopianDate(dateInput);

                            document.getElementById('view-date').innerText = eth.weekdayEng + " (" + eth.weekdaySom + ") " + eth.engDay + "/" + eth.engMonthName + "/" + eth.engYear;
                            
                            var manifestBody = document.getElementById('manifestBody');
                            var rowHtml = '';
                            selectedStudents.forEach(function(student, index) {
                                rowHtml += '<tr>' +
                                    '<td>' + (index + 1) + '</td>' +
                                    '<td style="text-transform: capitalize;">' + student.name.toLowerCase() + '</td>' +
                                    '<td>' + student.tin + '</td>' +
                                    '<td>' + student.car + '</td>' +
                                '</tr>';
                            });
                            manifestBody.innerHTML = rowHtml;

                            document.getElementById('view-ethio-note').innerText = "ከላይ የተዘረዘራችሁ " + eth.day + "/" + eth.month + "/" + eth.year + " " + eth.weekdayAmh;
                        }

                        function submitPostedStatus() {
                            if (currentSelectedIds.length === 0) return;
                            if (!confirm("Mark these " + currentSelectedIds.length + " students as posted? This grays out their names permanently.")) return;

                            fetch('/admin/mark-posted?password=${password || ''}', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ids: currentSelectedIds })
                            })
                            .then(function(res) {
                                if (res.ok) {
                                    currentSelectedIds.forEach(function(id) {
                                        var row = document.querySelector('tr[data-id="' + id + '"]');
                                        if (row) {
                                            row.classList.remove('selected-row');
                                            row.classList.add('already-posted');
                                            var cb = row.querySelector('.student-select');
                                            if (cb) {
                                                cb.checked = false;
                                                cb.disabled = true;
                                            }
                                        }
                                    });
                                    updateSelectedList();
                                    alert('Marked successfully! Rows updated.');
                                } else {
                                    alert('Error saving status updates.');
                                }
                            })
                            .catch(function(err) { console.error(err); });
                        }

                        updateSelectedList();
                    </script>
                </body>
                </html>
            `;

            res.send(htmlResponse);

        } catch (e) {
            console.error(e);
            res.status(500).send("Error loading admin dashboard");
        }
    });

    // 2. POST Action Handler Route
    router.post('/mark-posted', express.json(), async (req, res) => {
        const password = req.query.password;
        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).send("Unauthorized");
        }

        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids)) {
                return res.status(400).send("Invalid IDs payload structure");
            }

            const numericIds = ids.map(id => parseInt(id, 10));

            await prisma.carSubmission.updateMany({
                where: { id: { in: numericIds } },
                data: { isPosted: true }
            });

            res.sendStatus(200);
        } catch (err) {
            console.error(err);
            res.status(500).send("Database save error");
        }
    });

    return router;
};