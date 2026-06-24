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
                        <td>${row.id}</td>
                        <td class="student-name">${row.name}</td>
                        <td>${row.mobileNumber}</td>
                        <td>${row.carType}</td>
                        <td>${row.tinNumber || 'N/A'}</td>
                        <td style="color: #666; font-size: 13px;">${appDate}</td>
                    </tr>
                `;
            });

            const htmlResponse = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Admin Dashboard - Submissions</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 30px; background-color: #f4f6f9; color: #333; }
                        h1 { margin-bottom: 20px; font-weight: 600; }
                        
                        .minimal-bar { background: #fff; padding: 15px 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 25px; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
                        .filter-group { display: flex; align-items: center; gap: 10px; }
                        select, input[type="date"] { padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; }
                        
                        /* Two-Column Workspace Layout to stop content pushing downwards */
                        .dashboard-layout { display: flex; gap: 30px; align-items: flex-start; }
                        .left-panel { flex: 1; min-width: 0; }
                        .right-panel { width: 620px; position: sticky; top: 20px; flex-shrink: 0; }
                        
                        .data-table { width: 100%; border-collapse: collapse; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
                        .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                        .data-table th { background-color: #007bff; color: white; }
                        
                        tr.selected-row { background-color: #e2f0d9 !important; font-weight: bold; }
                        tr.already-posted { background-color: #f2f2f2 !important; color: #888; }
                        tr.already-posted td { border-bottom: 1px solid #e0e0e0; }
                        tr:hover { background-color: #f1f1f1; }
                        
                        .btn { display: inline-block; padding: 10px 15px; background: #28a745; color: white; text-decoration: none; border-radius: 4px; border: none; cursor: pointer; font-size: 14px; font-weight: bold; }
                        
                        /* --- CARDS FOR SCREENSHOTS --- */
                        .preview-container { display: none; }
                        .preview-card { 
                            width: 600px; 
                            background: #ffffff; 
                            border: 3px solid #007bff; 
                            border-radius: 12px; 
                            padding: 30px; 
                            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                            box-sizing: border-box;
                        }
                        .card-header { border-bottom: 2px dashed #007bff; padding-bottom: 15px; margin-bottom: 20px; }
                        .card-header h2 { margin: 0 0 10px 0; color: #007bff; font-size: 24px; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
                        .meta-info { font-size: 16px; line-height: 1.6; margin: 0; padding-left: 5px; }
                        
                        .manifest-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 15px; }
                        .manifest-table th { background-color: #f2f2f2; color: #333; font-weight: bold; border-top: 2px solid #333; border-bottom: 2px solid #333; }
                        .manifest-table th, .manifest-table td { padding: 10px 8px; text-align: left; }
                        .manifest-table td { border-bottom: 1px solid #eee; color: #222; }
                        .manifest-table tr:last-child td { border-bottom: 2px solid #333; }
                        
                        .card-footer { background: #f8f9fa; border-left: 4px solid #28a745; padding: 15px; border-radius: 4px; margin-top: 25px; }
                        .card-footer p { margin: 0; font-size: 15px; line-height: 1.6; font-weight: 500; }
                    </style>
                </head>
                <body>
                    <h1>Exam Form Submissions Dashboard</h1>
                    
                    <div class="minimal-bar">
                        <div class="filter-group">
                            <label for="carFilter"><strong>Type:</strong></label>
                            <select id="carFilter" onchange="filterTable()">
                                <option value="all">All License Categories</option>
                                <option value="AUTOMOBILE">AUTOMOBILE</option>
                                <option value="PASSENGER">PASSENGER ONE (R1)</option>
                                <option value="DRY CARGO">DRY CARGO ONE (D1)</option>
                                <option value="THREE CYCLE">THREE CYCLE</option>
                            </select>

                            <label for="examDate"><strong>Exam Date:</strong></label>
                            <input type="date" id="examDate" onchange="updateSelectedList()">
                        </div>

                        <div>
                            <span id="counter-label" style="font-size:15px; color:#333; font-weight:bold;">Selected: 0</span>
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
                                <h3 style="margin-top: 0; margin-bottom: 10px; color:#555;">Ready for Screenshot:</h3>
                                <div class="preview-card" id="postCard">
                                    <div class="card-header">
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
                            
                            var nativeWeekdaysEng = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
                            var weekdaysAmh = ['እሁድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'አርብ', 'ቅዳሜ'];
                            var weekdaysSom = ['axada', 'isniinta', 'talaadada', 'arbacada', 'khamiista', 'jimcaha', 'sabtida'];
                            var weekdayIdx = date.getDay();

                            var year = date.getFullYear();
                            var month = date.getMonth() + 1;
                            var day = date.getDate();

                            var ethYear = year - 8;
                            if (month < 9 || (month === 9 && day < 11)) {
                                ethYear -= 1;
                            }

                            var isLeap = (ethYear % 4 === 3);
                            var newYearDay = isLeap ? 12 : 11;
                            var ethMonth = 1;
                            var ethDay = 1;

                            var targetDate = new Date(date);
                            var startOfEthYear = new Date(year, 8, newYearDay); 
                            if (targetDate < startOfEthYear) {
                                startOfEthYear = new Date(year - 1, 8, isLeap ? 12 : 11);
                            }

                            var differenceInDays = Math.floor((targetDate - startOfEthYear) / (1000 * 60 * 60 * 24));
                            if (differenceInDays >= 0) {
                                ethMonth = Math.floor(differenceInDays / 30) + 1;
                                ethDay = (differenceInDays % 30) + 1;
                            }

                            var months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

                            return {
                                day: ethDay, month: ethMonth, year: ethYear,
                                weekdayAmh: weekdaysAmh[weekdayIdx],
                                weekdaySom: weekdaysSom[weekdayIdx],
                                weekdayEng: nativeWeekdaysEng[weekdayIdx],
                                engMonthName: months[date.getMonth()], engDay: date.getDate(), engYear: date.getFullYear()
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