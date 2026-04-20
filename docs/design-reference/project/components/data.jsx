// data.jsx — shared mock data for MendLog

const MACHINES = ['Injection Molder #3', 'CNC Lathe B-7', 'Conveyor Line 2', 'Hydraulic Press 01', 'Packaging Unit #5', 'Dye Mixer 04', 'Boiler #2'];
const DEPTS = ['Moulding', 'Machining', 'Assembly', 'Packaging', 'Utilities', 'Dyeing'];
const ROOT_CAUSES = [
  'Hydraulic seal failure on main cylinder — pressure dropped below spec',
  'Coolant pump impeller worn, cavitation under load',
  'Belt misalignment caused bearing wear on tail pulley',
  'Control relay K4 stuck closed — replaced with spare',
  'Oil leak near hydraulic pump — gasket degraded from heat cycling',
];

const JOBS = [
  { id: 127, machine: 'Injection Molder #3', dept: 'Moulding', inv: 'INV-0331', date: '2026-03-15', time: '09:14', idle: '4h 20m', status: 'awaiting-tl', lang: 'si', photos: 3, clips: 2, rootCause: ROOT_CAUSES[0], desc: 'Machine stopped mid-cycle, loud hiss from rear hydraulic unit, no movement on mold close.', action: 'Drained hydraulic reservoir, replaced main cylinder seal kit (part HC-0831), refilled with ISO 46 fluid. Ran 5 dry cycles.', remarks: '' },
  { id: 126, machine: 'CNC Lathe B-7', dept: 'Machining', inv: 'INV-0118', date: '2026-03-15', time: '13:40', idle: '1h 55m', status: 'complete', lang: 'en', photos: 2, clips: 1, rootCause: ROOT_CAUSES[1], desc: 'Coolant flow erratic, spindle temperature warning.', action: 'Replaced impeller assembly, flushed coolant lines.', remarks: 'Pump housing shows early corrosion — flag for monthly check.' },
  { id: 125, machine: 'Conveyor Line 2', dept: 'Packaging', inv: 'INV-0207', date: '2026-03-15', time: '16:20', idle: '2h 10m', status: 'complete', lang: 'si', photos: 4, clips: 1, rootCause: ROOT_CAUSES[2], desc: 'Abnormal squealing, belt tracking off by ~20mm.', action: 'Re-tensioned, aligned tail pulley, replaced bearing (PN 6205-2RS).', remarks: '' },
  { id: 124, machine: 'Hydraulic Press 01', dept: 'Moulding', inv: 'INV-0044', date: '2026-03-14', time: '10:05', idle: '3h 00m', status: 'complete', lang: 'en', photos: 2, clips: 2, rootCause: ROOT_CAUSES[3], desc: 'Press would not retract after cycle.', action: 'Swapped control relay K4, tested 20 cycles.', remarks: '' },
  { id: 123, machine: 'Packaging Unit #5', dept: 'Packaging', inv: 'INV-0519', date: '2026-03-13', time: '11:30', idle: '0h 45m', status: 'complete', lang: 'en', photos: 1, clips: 1, rootCause: 'Sensor dirty — false trigger', desc: 'Random stops every 3-4 minutes.', action: 'Cleaned photo-eye sensor, re-calibrated.', remarks: '' },
  { id: 122, machine: 'Dye Mixer 04', dept: 'Dyeing', inv: 'INV-0622', date: '2026-03-12', time: '08:15', idle: '5h 30m', status: 'complete', lang: 'si', photos: 3, clips: 3, rootCause: ROOT_CAUSES[4], desc: 'Oil pooling under machine, heat warning.', action: 'Replaced pump gasket and heat shield.', remarks: 'Recommend replacing pump entirely within 90 days.' },
  { id: 121, machine: 'Boiler #2', dept: 'Utilities', inv: 'INV-0711', date: '2026-03-10', time: '14:50', idle: '1h 10m', status: 'complete', lang: 'en', photos: 2, clips: 1, rootCause: 'Pressure relief valve stuck', desc: 'Pressure climbing past limit, safety trip.', action: 'Cleaned valve seat, tested at 8 bar.', remarks: '' },
];

// contribution grid — array of {date, count} for ~52 weeks ending today
function genActivity(weeks = 52) {
  const out = [];
  const today = new Date('2026-03-15');
  for (let w = weeks - 1; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const dt = new Date(today);
      dt.setDate(today.getDate() - (w * 7 + (6 - d)));
      // seedy pseudo-random
      const seed = dt.getFullYear() * 1000 + dt.getMonth() * 40 + dt.getDate();
      const r = (Math.sin(seed) * 10000) % 1;
      const n = Math.abs(r);
      let c = 0;
      if (n < 0.32) c = 0;
      else if (n < 0.58) c = 1;
      else if (n < 0.78) c = 2;
      else if (n < 0.92) c = 4;
      else c = 7;
      // weekends lighter
      const dow = dt.getDay();
      if (dow === 0 || dow === 6) c = Math.max(0, c - 2);
      out.push({ date: dt.toISOString().slice(0, 10), count: c });
    }
  }
  return out;
}

function heatColor(n) {
  if (n === 0) return T.heat0;
  if (n <= 1) return T.heat1;
  if (n <= 3) return T.heat2;
  if (n <= 6) return T.heat3;
  return T.heat4;
}

Object.assign(window, { MACHINES, DEPTS, JOBS, ROOT_CAUSES, genActivity, heatColor });
