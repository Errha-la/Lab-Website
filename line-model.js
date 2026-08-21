/* line-model.js — 閉環智慧製造產線 3D 模型
 *
 * 維護說明
 *   · 每座設備一個具名函式：sensorArray / visionStation / schedulingWall /
 *     plcCabinet / robotArm / spcBoard / ringConveyor / controlRoom / floorPlate。
 *     改外型只動那一個函式。
 *   · 尺寸集中在各函式頂端的 D 常數（datum），不要用臨時數字微調位置。
 *   · 工站文字（站名、設備名、對應論文）在 line-stations.json，不在這裡。
 *
 * 幾何準則（依 threejs-procedural-geometry）
 *   · 可見外殼一律用 beveledBox()，不留刀口邊。
 *   · 螢幕不是「貼在實體上的暗色平面」：screenModule() 由外殼 + 內縮邊框 +
 *     退縮 0.012m 的顯示面組成，是做進殼體的開口。
 *   · 每個 mesh 具名；材質按角色分槽，方便 OBJ/GLB 匯出後在其他軟體選取。
 *
 * 用法
 *   const THREE = await import('https://unpkg.com/three@0.184.0/build/three.module.js');
 *   const line = buildLine(THREE, { accent:'#5980a6', detail:'high', shadows:true });
 *   scene.add(line.group); line.update(seconds);
 *   line.anchors[i].position → 第 i 站標註錨點（世界座標）
 *   line.bounds             → { center, radius } 供相機推導取景距離
 *   line.dispose()          → 釋放 geometry / material
 *
 * 座標：公尺、y 軸向上、環心在原點。
 */

export const RING_RADIUS = 3.0;
export const DECK_Y = 0.62;
export const STATION_R = 4.55;

export function buildLine(THREE, opts = {}) {
  const accent = new THREE.Color(opts.accent || '#5980a6');
  const low = opts.detail === 'low';
  const shadows = opts.shadows !== false && !low;
  const seg = (hi, lo) => (low ? lo : hi);
  const pad = n => String(n).padStart(2, '0');

  /* ---------- 材質槽 ---------- */
  const mk = (name, hex, rough, metal, extra) =>
    new THREE.MeshStandardMaterial(Object.assign({ name, color: hex, roughness: rough, metalness: metal }, extra || {}));
  const M = {
    frame:  mk('steel_frame',  0x8d9aa6, 0.45, 0.35),
    deck:   mk('deck_plate',   0xd8dde2, 0.70, 0.10),
    belt:   mk('belt_rubber',  0x3c4650, 0.90, 0.00),
    accent: mk('accent_steel', accent.getHex(), 0.40, 0.30),
    dark:   mk('housing_dark', 0x2c455d, 0.50, 0.25),
    light:  mk('panel_light',  0x94bce3, 0.35, 0.15, { emissive: new THREE.Color(0x2b4463), emissiveIntensity: 0.4 }),
    part:   mk('workpiece',    0xc9a26b, 0.60, 0.20),
    glow:   mk('signal_glow',  accent.getHex(), 0.30, 0.10, { emissive: accent.clone(), emissiveIntensity: 0.9 })
  };

  const geos = [];
  const signs = [];
  const keep = g => { geos.push(g); return g; };
  const mesh = (geo, m, name) => {
    const o = new THREE.Mesh(keep(geo), m);
    o.name = name;
    if (shadows) { o.castShadow = true; o.receiveShadow = true; }
    return o;
  };

  /* ---------- 幾何工具 ---------- */
  function roundedRect(w, h, r) {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    r = Math.max(0.001, Math.min(r, w / 2 - 0.001, h / 2 - 0.001));
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  /* 導角方盒：四邊圓角 + 前後倒角，取代裸 BoxGeometry */
  function beveledBox(w, h, d, o) {
    o = o || {};
    if (low && !o.keepBevel) return new THREE.BoxGeometry(w, h, d);
    const f = Math.min(o.fillet == null ? 0.022 : o.fillet, w / 2.6, h / 2.6);
    const b = Math.min(o.bevel == null ? 0.014 : o.bevel, d / 2.6, f);
    const g = new THREE.ExtrudeGeometry(roundedRect(w, h, f), {
      depth: Math.max(0.001, d - 2 * b), bevelEnabled: true,
      bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: seg(3, 1), steps: 1
    });
    g.translate(0, 0, -(d - 2 * b) / 2);
    return g;
  }
  const bbox = (w, h, d, m, name, o) => mesh(beveledBox(w, h, d, o), m, name);

  /* 螢幕模組：背板 + 四邊框牆 + 退縮顯示面（真正的凹槽開口，不是貼平面） */
  function screenModule(name, w, h, o) {
    o = o || {};
    const g = new THREE.Group(); g.name = name;
    const d = o.depth == null ? 0.1 : o.depth;
    const bez = o.bezel == null ? 0.05 : o.bezel;
    const backD = Math.min(0.032, d / 2.4);
    const recess = Math.min(0.018, d / 4);
    const shellMat = o.shellMat || M.dark;

    const back = bbox(w, h, backD, shellMat, name + '_back_plate', { fillet: 0.02, bevel: 0.008 });
    back.position.z = -d / 2 + backD / 2; g.add(back);
    /* 邊框牆：與背板同深，形成凹槽 */
    const wallD = d - backD;
    const top = bbox(w, bez, wallD, shellMat, name + '_bezel_top', { fillet: 0.012, bevel: 0.008 });
    top.position.set(0, (h - bez) / 2, -d / 2 + backD + wallD / 2); g.add(top);
    const bot = top.clone(); bot.name = name + '_bezel_bottom'; bot.position.y = -(h - bez) / 2; g.add(bot);
    const left = bbox(bez, h - bez * 2, wallD, shellMat, name + '_bezel_left', { fillet: 0.012, bevel: 0.008 });
    left.position.set(-(w - bez) / 2, 0, top.position.z); g.add(left);
    const right = left.clone(); right.name = name + '_bezel_right'; right.position.x = (w - bez) / 2; g.add(right);
    /* 顯示面：退縮在凹槽內 */
    const fw = w - bez * 2, fh = h - bez * 2;
    const face = bbox(fw, fh, 0.016, M.light, name + '_display', { fillet: 0.008, bevel: 0.005 });
    face.position.z = d / 2 - recess - 0.008; g.add(face);
    g.userData.faceZ = face.position.z + 0.014;   // 內容線條貼在顯示面前方
    g.userData.inner = { w: fw, h: fh };
    return g;
  }
  /* 顯示面上的線條（甘特條、趨勢線、參數曲線） */
  function traceBar(host, w, name, x, y, m, rot) {
    const bar = bbox(w, 0.026, 0.012, m || M.accent, name, { fillet: 0.005, bevel: 0.004 });
    bar.position.set(x, y, host.userData.faceZ);
    if (rot) bar.rotation.z = rot;
    host.add(bar);
    return bar;
  }

  const group = new THREE.Group();
  group.name = 'closed_loop_line';
  const anim = { rollers: [], parts: [], arm: null, beacon: null, ringLight: null, hmi: [] };

  /* ---------- 廠房地板 ---------- */
  function floorPlate() {
    const D = { size: 16.0, thick: 0.14, kerb: 0.2 };   // 需涵蓋工站立牌環（半徑 6.85 + 0.75）
    const g = new THREE.Group(); g.name = 'floor';
    const plate = mesh(new THREE.BoxGeometry(D.size, D.thick, D.size), M.deck, 'floor_plate');
    plate.position.y = D.thick / 2; plate.castShadow = false;
    g.add(plate);
    for (const s of [-1, 1]) {
      const kx = bbox(D.size, D.kerb, 0.15, M.frame, 'floor_kerb_x' + (s > 0 ? 'p' : 'n'), { fillet: 0.03 });
      kx.position.set(0, D.thick + D.kerb / 2 - 0.02, s * (D.size / 2 - 0.075)); g.add(kx);
      const kz = kx.clone(); kz.name = 'floor_kerb_z' + (s > 0 ? 'p' : 'n');
      kz.position.set(s * (D.size / 2 - 0.075), kx.position.y, 0); kz.rotation.y = Math.PI / 2; g.add(kz);
    }
    return g;
  }

  /* ---------- 環形輸送帶 ---------- */
  function ringConveyor() {
    const R = RING_RADIUS, D = { half: 0.4, railR: 0.055, rollerR: 0.055, rollerL: 0.84 };
    const g = new THREE.Group(); g.name = 'conveyor';
    const rail = (r, name) => {
      const m = mesh(new THREE.TorusGeometry(r, D.railR, seg(14, 6), seg(120, 44)), M.frame, name);
      m.rotation.x = Math.PI / 2; m.position.y = DECK_Y + 0.14; return m;
    };
    g.add(rail(R + D.half + 0.02, 'conveyor_rail_outer'));
    g.add(rail(R - D.half - 0.02, 'conveyor_rail_inner'));

    const wall = mesh(new THREE.CylinderGeometry(R + D.half, R + D.half, 0.1, seg(120, 44), 1, true), M.belt, 'conveyor_belt_wall');
    wall.position.y = DECK_Y; g.add(wall);
    const top = mesh(new THREE.RingGeometry(R - D.half, R + D.half, seg(120, 44)), M.belt, 'conveyor_belt_surface');
    top.rotation.x = -Math.PI / 2; top.position.y = DECK_Y + 0.051; g.add(top);

    const nRoll = seg(48, 16);
    for (let i = 0; i < nRoll; i++) {
      const a = (i / nRoll) * Math.PI * 2;
      const r = mesh(new THREE.CylinderGeometry(D.rollerR, D.rollerR, D.rollerL, seg(14, 6)), M.accent, 'belt_roller_' + pad(i + 1));
      r.rotation.z = Math.PI / 2; r.rotation.y = -a;
      r.position.set(Math.cos(a) * R, DECK_Y - 0.02, Math.sin(a) * R);
      g.add(r); anim.rollers.push(r);
    }
    if (!low) for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + Math.PI / 12, hLeg = DECK_Y - 0.14;
      const leg = bbox(0.12, hLeg, 0.12, M.frame, 'conveyor_leg_' + pad(i + 1), { fillet: 0.016 });
      leg.position.set(Math.cos(a) * R, hLeg / 2 + 0.14, Math.sin(a) * R); g.add(leg);
    }
    return g;
  }

  /* ---------- 工件 ---------- */
  function workpieces() {
    const g = new THREE.Group(); g.name = 'workpieces';
    const n = seg(9, 6);
    for (let i = 0; i < n; i++) {
      const wp = bbox(0.34, 0.2, 0.34, M.part, 'workpiece_' + pad(i + 1), { fillet: 0.03, bevel: 0.02 });
      wp.userData.phase = (i / n) * Math.PI * 2 + 0.22;
      g.add(wp); anim.parts.push(wp);
    }
    return g;
  }

  /* ---------- 工站底座 ---------- */
  function stationBase(i, tag) {
    const g = new THREE.Group();
    const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
    g.position.set(Math.cos(a) * STATION_R, 0, Math.sin(a) * STATION_R);
    g.rotation.y = -a + Math.PI / 2;              // 正面朝環心
    g.name = 'station_' + tag;
    const p = bbox(2.1, 1.7, 0.1, M.accent, 'station_' + tag + '_pad', { fillet: 0.04, bevel: 0.02 });
    p.rotation.x = Math.PI / 2; p.position.y = 0.19;
    g.add(p);
    g.userData.angle = a;
    return g;
  }

  /* ---------- 01 振動感測：馬達 + 軸承座 + 三軸感測器陣列 + 接線盒 ---------- */
  function sensorArray(tag) {
    const D = { bedW: 1.6, bedH: 0.24, bedD: 0.95, axisY: 0.84, motorR: 0.33, motorL: 0.92, boxX: -1.02 };
    const g = new THREE.Group(); g.name = 'sensing_' + tag;
    const bed = bbox(D.bedW, D.bedD, D.bedH, M.frame, 'sensing_' + tag + '_bedplate', { fillet: 0.03 });
    bed.rotation.x = Math.PI / 2; bed.position.y = 0.24 + D.bedH / 2; g.add(bed);

    const motor = mesh(new THREE.CylinderGeometry(D.motorR, D.motorR, D.motorL, seg(32, 12)), M.dark, 'sensing_' + tag + '_motor_body');
    motor.rotation.z = Math.PI / 2; motor.position.set(-0.2, D.axisY, 0); g.add(motor);
    for (const s of [-1, 1]) {
      const bell = mesh(new THREE.CylinderGeometry(D.motorR + 0.03, D.motorR - 0.02, 0.09, seg(32, 12)), M.frame, 'sensing_' + tag + '_endbell_' + (s > 0 ? 'r' : 'l'));
      bell.rotation.z = s * Math.PI / 2; bell.position.set(-0.2 + s * (D.motorL / 2 + 0.04), D.axisY, 0); g.add(bell);
    }
    if (!low) for (let i = 0; i < 8; i++) {   // 散熱鰭片
      const fin = mesh(new THREE.CylinderGeometry(D.motorR + 0.025, D.motorR + 0.025, 0.02, seg(32, 12)), M.frame, 'sensing_' + tag + '_cooling_fin_' + (i + 1));
      fin.rotation.z = Math.PI / 2; fin.position.set(-0.58 + i * 0.1, D.axisY, 0); g.add(fin);
    }
    const shaft = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.66, seg(18, 8)), M.frame, 'sensing_' + tag + '_shaft');
    shaft.rotation.z = Math.PI / 2; shaft.position.set(0.52, D.axisY, 0); g.add(shaft);
    const brg = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.26, seg(28, 10)), M.frame, 'sensing_' + tag + '_bearing_housing');
    brg.rotation.z = Math.PI / 2; brg.position.set(0.76, D.axisY, 0); g.add(brg);
    const ped = bbox(0.32, 0.44, 0.32, M.frame, 'sensing_' + tag + '_bearing_pedestal', { fillet: 0.03 });
    ped.position.set(0.76, 0.5, 0); g.add(ped);

    /* 三軸加速度計 ×3：馬達殼、軸承座、機座 */
    const spots = [[-0.2, D.axisY + D.motorR + 0.09, 0], [0.76, D.axisY + 0.27, 0], [-0.66, 0.42, 0.4]];
    spots.forEach((p, k) => {
      const s = bbox(0.15, 0.15, 0.15, M.glow, 'sensing_' + tag + '_accelerometer_' + (k + 1), { fillet: 0.02, bevel: 0.015 });
      s.position.set(p[0], p[1], p[2]); g.add(s);
      if (!low) {
        const dx = D.boxX + 0.1 - p[0], dy = 1.2 - p[1];
        const len = Math.hypot(dx, dy);
        const c = mesh(new THREE.CylinderGeometry(0.017, 0.017, len, 6), M.dark, 'sensing_' + tag + '_signal_cable_' + (k + 1));
        c.position.set(p[0] + dx / 2, p[1] + dy / 2, p[2] * 0.5);
        c.rotation.z = Math.atan2(dy, dx) - Math.PI / 2; g.add(c);
      }
    });
    /* 接線盒（訊號匯集） */
    const jb = bbox(0.36, 0.5, 0.22, M.dark, 'sensing_' + tag + '_junction_box', { fillet: 0.025 });
    jb.position.set(D.boxX, 1.2, 0); g.add(jb);
    const jf = bbox(0.24, 0.3, 0.03, M.light, 'sensing_' + tag + '_junction_face', { fillet: 0.01, bevel: 0.008 });
    jf.position.set(D.boxX, 1.22, 0.12); g.add(jf);
    const post = bbox(0.1, 1.06, 0.1, M.frame, 'sensing_' + tag + '_post', { fillet: 0.014 });
    post.position.set(D.boxX, 0.68, 0); g.add(post);
    return { g, anchorY: 1.62 };
  }

  /* ---------- 02 故障診斷：工業攝影機 + 環形補光 + 判讀螢幕 ---------- */
  function visionStation(tag) {
    const D = { postH: 1.94, camY: 1.74, tableY: 0.62, gantryZ: -0.12, ringY: 1.1 };
    const g = new THREE.Group(); g.name = 'diagnosis_' + tag;
    for (const s of [-1, 1]) {
      const post = bbox(0.14, D.postH, 0.14, M.frame, 'diagnosis_' + tag + '_post_' + (s > 0 ? 'r' : 'l'), { fillet: 0.018 });
      post.position.set(s * 0.74, 0.24 + D.postH / 2, D.gantryZ); g.add(post);
    }
    const beam = bbox(1.76, 0.15, 0.26, M.frame, 'diagnosis_' + tag + '_beam', { fillet: 0.02 });
    beam.position.set(0, 0.24 + D.postH + 0.06, D.gantryZ); g.add(beam);
    const mount = bbox(0.18, 0.4, 0.18, M.frame, 'diagnosis_' + tag + '_camera_mount', { fillet: 0.02 });
    mount.position.set(0, D.camY + 0.36, 0.14); g.add(mount);

    /* 相機機身 + 鏡筒 + 玻璃 */
    const body = bbox(0.36, 0.36, 0.64, M.dark, 'diagnosis_' + tag + '_camera_body', { fillet: 0.028 });
    body.position.set(0, D.camY, 0.14); g.add(body);
    const barrel = mesh(new THREE.CylinderGeometry(0.145, 0.165, 0.36, seg(28, 10)), M.frame, 'diagnosis_' + tag + '_lens_barrel');
    barrel.position.set(0, D.camY - 0.34, 0.14); g.add(barrel);
    if (!low) for (let i = 0; i < 3; i++) {   // 對焦環
      const r = mesh(new THREE.TorusGeometry(0.16, 0.012, 8, seg(28, 10)), M.dark, 'diagnosis_' + tag + '_focus_ring_' + (i + 1));
      r.rotation.x = Math.PI / 2; r.position.set(0, D.camY - 0.26 - i * 0.07, 0.14); g.add(r);
    }
    const glass = mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.03, seg(28, 10)), M.light, 'diagnosis_' + tag + '_lens_glass');
    glass.position.set(0, D.camY - 0.53, 0.14); g.add(glass);

    /* 環形補光模組 */
    const ring = mesh(new THREE.TorusGeometry(0.44, 0.075, seg(16, 6), seg(48, 20)), M.glow, 'diagnosis_' + tag + '_ring_light');
    ring.rotation.x = Math.PI / 2; ring.position.set(0, D.ringY, 0.14); g.add(ring);
    anim.ringLight = ring;
    if (!low) for (const s of [-1, 1]) {
      const brk = bbox(0.06, 0.4, 0.06, M.frame, 'diagnosis_' + tag + '_light_bracket_' + (s > 0 ? 'r' : 'l'), { fillet: 0.01 });
      brk.position.set(s * 0.42, D.ringY + 0.22, 0.14); g.add(brk);
    }

    /* 檢測台與待檢件 */
    const table = bbox(0.94, 0.74, 0.11, M.deck, 'diagnosis_' + tag + '_inspection_table', { fillet: 0.02 });
    table.rotation.x = Math.PI / 2; table.position.set(0, D.tableY, 0.14); g.add(table);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const lg = bbox(0.07, 0.5, 0.07, M.frame, 'diagnosis_' + tag + '_table_leg_' + (sx > 0 ? 'r' : 'l') + (sz > 0 ? 'b' : 'f'), { fillet: 0.01 });
      lg.position.set(sx * 0.38, 0.34, 0.14 + sz * 0.28); g.add(lg);
    }
    const spec = bbox(0.3, 0.15, 0.3, M.part, 'diagnosis_' + tag + '_specimen', { fillet: 0.02, bevel: 0.015 });
    spec.position.set(0, D.tableY + 0.13, 0.14); g.add(spec);

    /* 判讀螢幕（YOLO 檢出框示意） */
    const scr = screenModule('diagnosis_' + tag + '_review_monitor', 0.9, 0.6, { depth: 0.1, bezel: 0.045 });
    scr.position.set(-1.06, 1.52, -0.06); scr.rotation.y = 0.44; g.add(scr);
    if (!low) {
      traceBar(scr, 0.3, 'diagnosis_' + tag + '_bbox_top', -0.12, 0.14, M.glow);
      traceBar(scr, 0.3, 'diagnosis_' + tag + '_bbox_bottom', -0.12, -0.06, M.glow);
      traceBar(scr, 0.2, 'diagnosis_' + tag + '_bbox_left', -0.27, 0.04, M.glow, Math.PI / 2);
      traceBar(scr, 0.2, 'diagnosis_' + tag + '_bbox_right', 0.03, 0.04, M.glow, Math.PI / 2);
      traceBar(scr, 0.22, 'diagnosis_' + tag + '_readout_1', 0.19, 0.16, M.accent);
      traceBar(scr, 0.16, 'diagnosis_' + tag + '_readout_2', 0.16, 0.07, M.accent);
    }
    const stand = bbox(0.11, 1.1, 0.11, M.frame, 'diagnosis_' + tag + '_monitor_stand', { fillet: 0.014 });
    stand.position.set(-1.06, 0.74, -0.06); g.add(stand);
    const foot = bbox(0.44, 0.36, 0.07, M.frame, 'diagnosis_' + tag + '_monitor_foot', { fillet: 0.02 });
    foot.rotation.x = Math.PI / 2; foot.position.set(-1.06, 0.26, -0.06); g.add(foot);
    return { g, anchorY: 2.54 };
  }

  /* ---------- 03 決策優化：中控螢幕牆（甘特圖 / 收斂曲線） ---------- */
  function schedulingWall(tag) {
    const D = { wallW: 2.5, wallH: 1.56, wallY: 1.42, wallZ: -0.4, cols: 3, rows: 2 };
    const g = new THREE.Group(); g.name = 'decision_' + tag;
    const carrier = bbox(D.wallW + 0.14, D.wallH + 0.14, 0.14, M.frame, 'decision_' + tag + '_wall_carrier', { fillet: 0.03 });
    carrier.position.set(0, D.wallY, D.wallZ - 0.06); g.add(carrier);
    for (const s of [-1, 1]) {
      const leg = bbox(0.13, 1.5, 0.13, M.frame, 'decision_' + tag + '_wall_leg_' + (s > 0 ? 'r' : 'l'), { fillet: 0.016 });
      leg.position.set(s * (D.wallW / 2 - 0.1), 0.9, D.wallZ - 0.06); g.add(leg);
    }
    /* 3×2 排程看板：每格是獨立螢幕模組 */
    const pw = D.wallW / D.cols - 0.06, ph = D.wallH / D.rows - 0.06;
    let k = 0;
    for (let r = 0; r < D.rows; r++) for (let c = 0; c < D.cols; c++) {
      k++;
      const p = screenModule('decision_' + tag + '_panel_' + k, pw, ph, { depth: 0.09, bezel: 0.035 });
      p.position.set(-D.wallW / 2 + pw / 2 + 0.03 + c * (pw + 0.06), D.wallY + D.wallH / 2 - ph / 2 - 0.03 - r * (ph + 0.06), D.wallZ);
      g.add(p);
      if (low) continue;
      if (k % 2) {   // 甘特條
        for (let b = 0; b < 4; b++) {
          const w = 0.16 + ((b * 7 + k * 3) % 4) * 0.08;
          traceBar(p, w, 'decision_' + tag + '_panel_' + k + '_gantt_' + (b + 1),
            -pw / 2 + 0.1 + w / 2 + ((b * 5 + k) % 3) * 0.07, ph / 2 - 0.12 - b * 0.11, M.accent);
        }
      } else {       // 收斂曲線
        const ys = [0.16, 0.06, -0.02, -0.07, -0.1];
        for (let i = 0; i < ys.length - 1; i++) {
          const x1 = -pw / 2 + 0.09 + i * 0.13, dy = ys[i + 1] - ys[i], dx = 0.13;
          traceBar(p, Math.hypot(dx, dy), 'decision_' + tag + '_panel_' + k + '_curve_' + (i + 1),
            x1 + dx / 2, (ys[i] + ys[i + 1]) / 2, M.glow, Math.atan2(dy, dx));
        }
      }
    }
    /* 操作台 */
    const desk = bbox(1.8, 0.66, 0.1, M.deck, 'decision_' + tag + '_console_desk', { fillet: 0.02 });
    desk.rotation.x = Math.PI / 2; desk.position.set(0, 0.84, 0.44); g.add(desk);
    const apron = bbox(1.8, 0.6, 0.09, M.frame, 'decision_' + tag + '_console_apron', { fillet: 0.02 });
    apron.position.set(0, 0.52, 0.73); g.add(apron);
    for (const s of [-1, 1]) {
      const kb = bbox(0.52, 0.22, 0.035, M.dark, 'decision_' + tag + '_keyboard_' + (s > 0 ? 'r' : 'l'), { fillet: 0.012, bevel: 0.01 });
      kb.rotation.x = Math.PI / 2; kb.position.set(s * 0.46, 0.9, 0.46); g.add(kb);
    }
    return { g, anchorY: 2.42 };
  }

  /* ---------- 04a 製程控制：PLC 控制箱 + HMI 觸控面板 ---------- */
  function plcCabinet(tag) {
    const D = { w: 1.0, h: 1.7, d: 0.52, x: -0.78, y: 1.09 };
    const g = new THREE.Group(); g.name = 'control_' + tag + '_plc';
    const shell = bbox(D.w, D.h, D.d, M.dark, 'control_' + tag + '_plc_enclosure', { fillet: 0.03 });
    shell.position.set(D.x, D.y, 0); g.add(shell);
    const door = bbox(D.w - 0.08, D.h - 0.12, 0.05, M.frame, 'control_' + tag + '_plc_door', { fillet: 0.02, bevel: 0.012 });
    door.position.set(D.x, D.y, D.d / 2 - 0.012); g.add(door);
    const handle = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.24, seg(14, 6)), M.frame, 'control_' + tag + '_door_handle');
    handle.position.set(D.x + D.w / 2 - 0.12, D.y - 0.1, D.d / 2 + 0.04); g.add(handle);

    /* HMI 觸控面板（前傾 12°，製程參數曲線） */
    const hmi = screenModule('control_' + tag + '_hmi_panel', 0.66, 0.46, { depth: 0.08, bezel: 0.04 });
    hmi.position.set(D.x, D.y + 0.44, D.d / 2 + 0.06); hmi.rotation.x = -0.21; g.add(hmi);
    if (!low) {
      const ys = [0.06, 0.11, 0.02, 0.09, 0.0];
      for (let i = 0; i < ys.length - 1; i++) {
        const dy = ys[i + 1] - ys[i], dx = 0.12;
        anim.hmi.push(traceBar(hmi, Math.hypot(dx, dy), 'control_' + tag + '_hmi_trace_' + (i + 1),
          -0.23 + i * dx + dx / 2, (ys[i] + ys[i + 1]) / 2, M.glow, Math.atan2(dy, dx)));
      }
      traceBar(hmi, 0.44, 'control_' + tag + '_hmi_setpoint', 0, -0.1, M.accent);
    }
    /* 旋鈕與指示燈 */
    for (let i = 0; i < 3; i++) {
      const knob = mesh(new THREE.CylinderGeometry(0.055, 0.062, 0.075, seg(18, 8)), M.frame, 'control_' + tag + '_knob_' + (i + 1));
      knob.rotation.x = Math.PI / 2; knob.position.set(D.x - 0.22 + i * 0.22, D.y - 0.24, D.d / 2 + 0.03); g.add(knob);
      const lamp = mesh(new THREE.SphereGeometry(0.042, seg(18, 8), seg(14, 6)), i === 0 ? M.glow : M.light, 'control_' + tag + '_indicator_' + (i + 1));
      lamp.position.set(D.x - 0.22 + i * 0.22, D.y - 0.05, D.d / 2 + 0.02); g.add(lamp);
    }
    /* 出線至手臂的線槽 */
    const duct = bbox(0.14, 0.14, 0.62, M.frame, 'control_' + tag + '_cable_duct', { fillet: 0.02 });
    duct.rotation.y = Math.PI / 2; duct.position.set(-0.2, 0.34, -0.1); g.add(duct);
    return g;
  }

  /* ---------- 04b 受控機械手臂（擺動；運動包絡已避開控制箱與輸送帶） ---------- */
  function robotArm(tag) {
    const D = { x: 0.72, baseR: 0.4, trunkH: 0.42, upper: 0.92, fore: 0.78 };
    const root = new THREE.Group(); root.name = 'control_' + tag + '_robot';
    root.position.set(D.x, 0.24, 0);
    const base = mesh(new THREE.CylinderGeometry(D.baseR - 0.05, D.baseR, 0.3, seg(28, 10)), M.frame, 'control_' + tag + '_robot_base');
    base.position.y = 0.15; root.add(base);
    const collar = mesh(new THREE.TorusGeometry(D.baseR - 0.07, 0.03, 8, seg(28, 10)), M.dark, 'control_' + tag + '_robot_base_collar');
    collar.rotation.x = Math.PI / 2; collar.position.y = 0.3; root.add(collar);

    const yaw = new THREE.Group(); yaw.name = 'control_' + tag + '_robot_yaw_joint';
    yaw.position.y = 0.3; root.add(yaw);
    const trunk = mesh(new THREE.CylinderGeometry(0.24, 0.3, D.trunkH, seg(24, 8)), M.dark, 'control_' + tag + '_robot_trunk');
    trunk.position.y = D.trunkH / 2; yaw.add(trunk);

    const shoulder = new THREE.Group(); shoulder.name = 'control_' + tag + '_robot_shoulder_joint';
    shoulder.position.y = D.trunkH; yaw.add(shoulder);
    const sJoint = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.3, seg(20, 8)), M.frame, 'control_' + tag + '_robot_shoulder_hub');
    sJoint.rotation.z = Math.PI / 2; shoulder.add(sJoint);
    const upper = bbox(0.21, D.upper, 0.25, M.accent, 'control_' + tag + '_robot_upper_arm', { fillet: 0.05 });
    upper.position.y = D.upper / 2 + 0.02; shoulder.add(upper);

    const elbow = new THREE.Group(); elbow.name = 'control_' + tag + '_robot_elbow_joint';
    elbow.position.y = D.upper + 0.04; shoulder.add(elbow);
    const eJoint = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.26, seg(20, 8)), M.frame, 'control_' + tag + '_robot_elbow_hub');
    eJoint.rotation.z = Math.PI / 2; elbow.add(eJoint);
    const fore = bbox(0.18, D.fore, 0.21, M.accent, 'control_' + tag + '_robot_forearm', { fillet: 0.045 });
    fore.position.y = D.fore / 2 + 0.02; elbow.add(fore);
    const wrist = bbox(0.24, 0.17, 0.24, M.dark, 'control_' + tag + '_robot_wrist', { fillet: 0.03 });
    wrist.position.y = D.fore + 0.1; elbow.add(wrist);
    const fingers = [];
    for (const s of [-1, 1]) {
      const f = bbox(0.055, 0.27, 0.12, M.frame, 'control_' + tag + '_robot_finger_' + (s > 0 ? 'r' : 'l'), { fillet: 0.015 });
      f.position.set(s * 0.09, D.fore + 0.32, 0); f.rotation.z = -s * 0.1; elbow.add(f);
      f.userData.sign = s; fingers.push(f);
    }

    /* 出料檯（放回點）＋ 被搬運的包裹 */
    const tray = bbox(0.54, 0.12, 0.54, M.deck, 'control_' + tag + '_output_tray', { fillet: 0.02 });
    tray.position.set(1.24, 0.01, 0.35); root.add(tray);
    const payload = bbox(0.24, 0.22, 0.24, M.part, 'control_' + tag + '_payload', { fillet: 0.03, bevel: 0.02 });
    payload.visible = false; root.add(payload);
    const parked = bbox(0.24, 0.22, 0.24, M.part, 'control_' + tag + '_payload_placed', { fillet: 0.03, bevel: 0.02 });
    parked.position.set(1.24, 0.18, 0.35); parked.visible = false; root.add(parked);

    /* IK 參數：肩點高度、上臂／前臂（含手腕夾具）有效長度 */
    anim.arm = {
      yaw, shoulder, elbow, fingers, payload, parked,
      h0: 0.3 + D.trunkH, L1: D.upper + 0.04, L2: D.fore + 0.42
    };
    return root;
  }

  /* ---------- 工站立牌（3D 看板，取代浮空文字） ---------- */
  function signboard(i, tag) {
    const g = new THREE.Group(); g.name = 'station_' + tag + '_signboard';
    g.position.set(0.1, 0.14, 2.3);                // 腳座落在地板面（厚 0.14）；z 由實測取景驗證
    const foot = bbox(0.62, 0.06, 0.34, M.frame, 'station_' + tag + '_sign_foot', { fillet: 0.02 });
    foot.position.y = 0.03; g.add(foot);
    for (const s of [-1, 1]) {
      const p = bbox(0.075, 0.95, 0.075, M.frame, 'station_' + tag + '_sign_post_' + (s > 0 ? 'r' : 'l'), { fillet: 0.012 });
      p.position.set(s * 0.62, 0.45, 0); g.add(p);
    }
    const panel = bbox(1.5, 0.78, 0.07, M.deck, 'station_' + tag + '_sign_panel', { fillet: 0.02 });
    panel.position.set(0, 1.11, 0); g.add(panel);   // 世界高度維持 1.25

    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 266;
    const tex = new THREE.CanvasTexture(cv);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.Mesh(keep(new THREE.PlaneGeometry(1.42, 0.7)),
      new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    face.name = 'station_' + tag + '_sign_face';
    face.position.set(0, 1.11, 0.038); g.add(face);

    const draw = st => {
      const c = cv.getContext('2d'), W = cv.width, H = cv.height;
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#f2f2f3'; c.fillRect(0, 0, W, H);
      c.strokeStyle = '#' + accent.getHexString(); c.lineWidth = 6;
      c.strokeRect(3, 3, W - 6, H - 6);
      c.fillStyle = '#' + accent.getHexString(); c.fillRect(3, 3, W - 6, 8);
      c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      c.fillStyle = '#4a6d92';
      c.font = '700 40px "Barlow Condensed", "Arial Narrow", sans-serif';
      c.fillText(String(st.num || '').toUpperCase(), 34, 84);
      c.fillStyle = '#1d3a58';
      c.font = '600 62px "Barlow Condensed", "Noto Sans TC", sans-serif';
      c.fillText(String(st.zh || ''), 34, 158);
      c.fillStyle = '#5b6570';
      c.font = '400 32px Barlow, "Noto Sans TC", sans-serif';
      c.fillText(String(st.device || ''), 34, 212);
      tex.needsUpdate = true;
    };
    const st0 = (opts.stations || [])[i] || {};
    draw({ num: st0.num || 'ST ' + tag, zh: st0.zh || '', device: st0.device || '' });
    signs[i] = { draw, group: g };
    return g;
  }

  /* ---------- 05 品質回饋：SPC 管制圖螢幕 + 報表看板 ---------- */
  function spcBoard(tag) {
    const D = { x: -0.42, y: 1.62, w: 1.54, h: 0.98 };
    const g = new THREE.Group(); g.name = 'feedback_' + tag;
    const foot = bbox(0.52, 0.46, 0.09, M.frame, 'feedback_' + tag + '_monitor_foot', { fillet: 0.02 });
    foot.rotation.x = Math.PI / 2; foot.position.set(D.x, 0.28, 0); g.add(foot);
    const neck = bbox(0.13, 0.94, 0.13, M.frame, 'feedback_' + tag + '_monitor_neck', { fillet: 0.016 });
    neck.position.set(D.x, 0.72, 0); g.add(neck);

    const mon = screenModule('feedback_' + tag + '_spc_monitor', D.w, D.h, { depth: 0.11, bezel: 0.055 });
    mon.position.set(D.x, D.y, 0); g.add(mon);
    /* 上下管制界線 + 中心線 */
    traceBar(mon, 1.22, 'feedback_' + tag + '_ucl', 0, 0.29, M.accent);
    traceBar(mon, 1.22, 'feedback_' + tag + '_centerline', 0, 0, M.frame);
    traceBar(mon, 1.22, 'feedback_' + tag + '_lcl', 0, -0.29, M.accent);
    if (!low) {   // 趨勢折線
      const ys = [0.06, -0.1, 0.14, -0.04, 0.2, 0.02, -0.16, 0.1];
      for (let i = 0; i < ys.length - 1; i++) {
        const dx = 0.16, dy = ys[i + 1] - ys[i];
        traceBar(mon, Math.hypot(dx, dy), 'feedback_' + tag + '_trend_seg_' + (i + 1),
          -0.56 + i * dx + dx / 2, (ys[i] + ys[i + 1]) / 2, M.glow, Math.atan2(dy, dx));
      }
    }
    /* 品保報表看板 */
    const board = bbox(0.84, 1.14, 0.07, M.deck, 'feedback_' + tag + '_report_board', { fillet: 0.02 });
    board.position.set(0.82, 1.14, -0.12); board.rotation.y = -0.5; g.add(board);
    if (!low) for (let i = 0; i < 5; i++) {
      const row = bbox(0.58, 0.05, 0.02, M.accent, 'feedback_' + tag + '_report_row_' + (i + 1), { fillet: 0.008, bevel: 0.006 });
      row.position.copy(board.position); row.rotation.y = board.rotation.y;
      row.translateY(0.4 - i * 0.19); row.translateZ(0.045); g.add(row);
    }
    const bpost = bbox(0.11, 1.5, 0.11, M.frame, 'feedback_' + tag + '_board_post', { fillet: 0.014 });
    bpost.position.set(0.82, 0.9, -0.12); g.add(bpost);
    return { g, anchorY: 2.3 };
  }

  /* ---------- 環心中控室 ---------- */
  function controlRoom() {
    const g = new THREE.Group(); g.name = 'control_room';
    const body = bbox(1.94, 0.92, 1.94, M.deck, 'control_room_body', { fillet: 0.05 });
    body.position.y = 0.58; g.add(body);
    const glazing = bbox(1.78, 0.42, 1.78, M.light, 'control_room_glazing', { fillet: 0.04 });
    glazing.position.y = 0.78; g.add(glazing);
    const roof = bbox(2.14, 2.14, 0.14, M.frame, 'control_room_roof', { fillet: 0.05 });
    roof.rotation.x = Math.PI / 2; roof.position.y = 1.09; g.add(roof);
    const mast = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.92, seg(14, 6)), M.frame, 'control_room_mast');
    mast.position.y = 1.6; g.add(mast);
    const beacon = mesh(new THREE.SphereGeometry(0.11, seg(22, 8), seg(16, 6)), M.glow, 'control_room_beacon');
    beacon.position.y = 2.1; g.add(beacon);
    anim.beacon = beacon;
    if (!low) for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      const len = RING_RADIUS - 1.35, rMid = 0.97 + len / 2;
      const bridge = bbox(len, 0.09, 0.32, M.frame, 'service_bridge_' + (k + 1), { fillet: 0.02 });
      bridge.position.set(Math.cos(a) * rMid, DECK_Y + 0.02, Math.sin(a) * rMid);
      bridge.rotation.y = -a; g.add(bridge);
    }
    return g;
  }

  /* ---------- 組裝 ---------- */
  group.add(floorPlate(), ringConveyor(), workpieces(), controlRoom());
  const builders = [sensorArray, visionStation, schedulingWall, null, spcBoard];
  const anchors = [];
  for (let i = 0; i < 5; i++) {
    const tag = pad(i + 1);
    const base = stationBase(i, tag);
    let anchorY = 2.3;
    if (i === 3) { base.add(plcCabinet(tag), robotArm(tag)); anchorY = 2.35; }
    else { const b = builders[i](tag); base.add(b.g); anchorY = b.anchorY; }
    base.add(signboard(i, tag));
    group.add(base);
    const a = base.userData.angle;
    anchors.push({
      index: i, tag, angle: a,
      position: new THREE.Vector3(Math.cos(a) * STATION_R, anchorY, Math.sin(a) * STATION_R)
    });
  }

  /* 取景用邊界球（相機距離由此推導，不寫死數字） */
  const bb = new THREE.Box3().setFromObject(group);
  const sph = bb.getBoundingSphere(new THREE.Sphere());
  const bounds = { center: sph.center.clone(), radius: sph.radius, contentRadius: STATION_R + 2.1, box: bb };

  /* ---------- 動態 ---------- */
  const speed = opts.speed == null ? 1 : opts.speed;
  function update(t) {
    const s = t * speed;
    for (const r of anim.rollers) r.rotation.x = s * 3.4;
    for (const wp of anim.parts) {
      const a = wp.userData.phase + s * 0.22;
      wp.position.set(Math.cos(a) * RING_RADIUS, DECK_Y + 0.16, Math.sin(a) * RING_RADIUS);
      wp.rotation.y = -a;
    }
    if (anim.arm) armCycle(s);
    if (anim.beacon) anim.beacon.material.emissiveIntensity = 0.55 + Math.sin(s * 3.2) * 0.35;
    if (anim.ringLight) anim.ringLight.material.emissiveIntensity = 0.75 + Math.sin(s * 2.1) * 0.2;
  }

  /* 取放循環：二連桿 IK 追一條關鍵點路徑（座標相對手臂根節點） */
  /* 取放循環：關鍵點「先停留、再移動」；停留段內切換夾爪，移動段夾爪不變 */
  const ARM_PATH = [
    { p: [-0.72, 0.98, -1.55], hold: 0.25, grip: 0, dur: 0.8 },  // 輸送帶上方待命
    { p: [-0.72, 0.68, -1.55], hold: 0.45, grip: 1, dur: 0.8 },  // 下探到位 → 合爪（對齊帶面工件）
    { p: [-0.72, 1.06, -1.40], hold: 0.0,  grip: 1, dur: 1.2 },  // 夾起
    { p: [ 1.24, 0.98,  0.35], hold: 0.1,  grip: 1, dur: 0.7 },  // 出料檯上方
    { p: [ 1.24, 0.32,  0.35], hold: 0.45, grip: 0, dur: 0.6 },  // 觸面到位 → 鬆爪
    { p: [ 1.24, 0.98,  0.35], hold: 0.0,  grip: 0, dur: 1.2 }   // 抬手回起點
  ];
  const ARM_TOTAL = ARM_PATH.reduce((a, k) => a + k.hold + k.dur, 0);
  const smooth = x => x * x * (3 - 2 * x);
  const polar = p => ({ psi: Math.atan2(p[0], p[2]), d: Math.hypot(p[0], p[2]), y: p[1] });
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

  function armCycle(s) {
    const A = anim.arm, n = ARM_PATH.length;
    let t = (s * 0.62) % ARM_TOTAL, k = 0;
    for (; k < n; k++) {
      const span = ARM_PATH[k].hold + ARM_PATH[k].dur;
      if (t < span) break;
      t -= span;
    }
    if (k >= n) k = n - 1;
    const a = ARM_PATH[k], b = ARM_PATH[(k + 1) % n], prev = ARM_PATH[(k + n - 1) % n];
    const holding = t < a.hold;
    /* 停留：手不動，夾爪由前一狀態過渡到本關鍵點狀態 */
    const u = holding ? 0 : smooth(Math.min(1, (t - a.hold) / a.dur));
    const grip = holding
      ? prev.grip + (a.grip - prev.grip) * smooth(Math.min(1, t / Math.max(0.001, a.hold)))
      : a.grip;

    /* 極座標插值：繞底座掃過去，不穿越迴轉奇異點 */
    const pa = polar(a.p), pb = polar(b.p);
    const psi = pa.psi + wrap(pb.psi - pa.psi) * u;
    const d = pa.d + (pb.d - pa.d) * u;
    const ty = pa.y + (pb.y - pa.y) * u;
    const tx = Math.sin(psi) * d, tz = Math.cos(psi) * d;
    A.yaw.rotation.y = psi;

    /* 平面內二連桿解析解（肘部限位 2.4 rad，避免對折） */
    const dy = ty - A.h0, L1 = A.L1, L2 = A.L2;
    const r = Math.min(L1 + L2 - 0.03, Math.max(Math.abs(L1 - L2) + 0.05, Math.hypot(d, dy)));
    const c2 = Math.max(-1, Math.min(1, (r * r - L1 * L1 - L2 * L2) / (2 * L1 * L2)));
    const e = Math.min(2.4, Math.acos(c2));
    A.shoulder.rotation.x = Math.atan2(d, dy) - Math.atan2(L2 * Math.sin(e), L1 + L2 * Math.cos(e));
    A.elbow.rotation.x = e;

    for (const f of A.fingers) f.position.x = f.userData.sign * (0.155 - 0.065 * grip);
    const carrying = grip > 0.5;
    A.payload.visible = carrying;
    if (carrying) A.payload.position.set(tx, ty - 0.14, tz);
    /* 放回的包裹留在出料檯，直到下一輪合爪才交棒 */
    A.parked.visible = !carrying && (k >= 4 || k === 0 || k === 1);
  }

  function dispose() {
    group.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
    geos.forEach(g => g.dispose()); geos.length = 0;
    Object.values(M).forEach(m => m.dispose());
  }

  /* 立牌文字外部覆寫（資料由 line-stations.json 帶入） */
  function setSignText(i, st) { if (signs[i]) signs[i].draw(st || {}); }

  return { group, anchors, bounds, materials: M, update, dispose, setSignText, RING_RADIUS, STATION_R, DECK_Y, detail: low ? 'low' : 'high' };
}
