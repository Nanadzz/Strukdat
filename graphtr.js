const fs = require('fs');
class Graph {
  constructor() {
    this.adjList = new Map();
  }

  // Tambah simpul baru ke dalam graf
  addVertex(v) {
    if (!this.adjList.has(v)) {
      this.adjList.set(v, []);
    }
  }

  // Tambah sisi dua arah (undirected) antara u dan v
  addEdge(u, v) {
    this.addVertex(u);
    this.addVertex(v);
    this.adjList.get(u).push(v);
    this.adjList.get(v).push(u);
  }

  // ─────────────────────────────────────────────
  //  Muat dataset dari file JSON
  // ─────────────────────────────────────────────
  loadFromJSON(filePath) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    for (const edge of data.edges) {
      this.addEdge(edge.from, edge.to);
    }
    console.log(`✔ Dataset dimuat dari ${filePath}`);
    console.log(`  Simpul : ${this.adjList.size}`);
    console.log(`  Sisi   : ${data.edges.length}\n`);
  }

  // ─────────────────────────────────────────────
  //  Muat dataset dari file CSV (format: from,to,weight)
  // ─────────────────────────────────────────────
  loadFromCSV(filePath) {
    const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n');
    let edgeCount = 0;
    for (let i = 1; i < lines.length; i++) {           // skip header
      const parts = lines[i].trim().split(',');
      if (parts.length >= 2) {
        this.addEdge(parts[0].trim(), parts[1].trim());
        edgeCount++;
      }
    }
    console.log(`✔ Dataset dimuat dari ${filePath}`);
    console.log(`  Simpul : ${this.adjList.size}`);
    console.log(`  Sisi   : ${edgeCount}\n`);
  }

  // ─────────────────────────────────────────────
  //  Tampilkan adjacency list
  // ─────────────────────────────────────────────
  printGraph() {
    console.log('── Adjacency List ──────────────────────');
    for (const [vertex, neighbors] of this.adjList) {
      console.log(`  ${vertex}  →  [ ${neighbors.join(', ')} ]`);
    }
    console.log('────────────────────────────────────────\n');
  }

  // ─────────────────────────────────────────────
  //  BFS — Breadth-First Search (Queue / FIFO)
  //  Menjamin jalur dengan jumlah hop terkecil
  //  Referensi: Bernov et al. (2022), JEECS
  // ─────────────────────────────────────────────
  bfs(start) {
    if (!this.adjList.has(start)) {
      console.error(`BFS Error: simpul "${start}" tidak ditemukan.`);
      return [];
    }

    const visited  = new Set();
    const queue    = [start];
    const result   = [];
    const levelMap = {};          // simpul → level (jarak dari start)

    visited.add(start);
    levelMap[start] = 0;

    const startTime = performance.now();

    while (queue.length > 0) {
      const v = queue.shift();          // dequeue — O(n) pada array biasa
      result.push(v);

      for (const nb of this.adjList.get(v)) {
        if (!visited.has(nb)) {
          visited.add(nb);
          queue.push(nb);
          levelMap[nb] = levelMap[v] + 1;
        }
      }
    }

    const elapsed = (performance.now() - startTime).toFixed(4);

    // Output hasil
    console.log('── BFS (Breadth-First Search) ──────────');
    console.log(`  Start  : ${start}`);
    console.log(`  Urutan : ${result.join(' → ')}`);
    console.log(`  Iterasi: ${result.length} simpul dikunjungi`);
    console.log(`  Waktu  : ${elapsed} ms`);
    console.log('  Level kunjungan:');
    for (const [node, lvl] of Object.entries(levelMap)) {
      console.log(`    Level ${lvl}  →  ${node}`);
    }
    console.log('────────────────────────────────────────\n');

    return result;
  }

  // ─────────────────────────────────────────────
  //  DFS — Depth-First Search (Rekursif / Stack implisit)
  //  Menelusuri sejauh mungkin sebelum backtrack
  //  Referensi: Putri Mirda et al. (2022), JUTIF
  // ─────────────────────────────────────────────
  dfsHelper(v, visited, result, depth, depthMap) {
    visited.add(v);
    result.push(v);
    depthMap[v] = depth;

    for (const nb of this.adjList.get(v)) {
      if (!visited.has(nb)) {
        this.dfsHelper(nb, visited, result, depth + 1, depthMap);
      }
    }
  }

  dfs(start) {
    if (!this.adjList.has(start)) {
      console.error(`DFS Error: simpul "${start}" tidak ditemukan.`);
      return [];
    }

    const visited  = new Set();
    const result   = [];
    const depthMap = {};

    const startTime = performance.now();

    this.dfsHelper(start, visited, result, 0, depthMap);

    const elapsed   = (performance.now() - startTime).toFixed(4);
    const maxDepth  = Math.max(...Object.values(depthMap));

    // Output hasil
    console.log('── DFS (Depth-First Search) ────────────');
    console.log(`  Start       : ${start}`);
    console.log(`  Urutan      : ${result.join(' → ')}`);
    console.log(`  Iterasi     : ${result.length} simpul dikunjungi`);
    console.log(`  Kedalaman   : ${maxDepth} (jalur rekursi terdalam)`);
    console.log(`  Waktu       : ${elapsed} ms`);
    console.log('  Kedalaman per simpul:');
    for (const [node, d] of Object.entries(depthMap)) {
      console.log(`    Depth ${d}  →  ${node}`);
    }
    console.log('────────────────────────────────────────\n');

    return result;
  }

  // ─────────────────────────────────────────────
  //  DFS Iteratif menggunakan Stack eksplisit
  //  (alternatif non-rekursif, menghindari stack overflow)
  // ─────────────────────────────────────────────
  dfsIterative(start) {
    if (!this.adjList.has(start)) {
      console.error(`DFS Iteratif Error: simpul "${start}" tidak ditemukan.`);
      return [];
    }

    const visited = new Set();
    const stack   = [start];
    const result  = [];

    const startTime = performance.now();

    while (stack.length > 0) {
      const v = stack.pop();
      if (!visited.has(v)) {
        visited.add(v);
        result.push(v);
        // Masukkan tetangga dalam urutan terbalik agar urutan kunjungan
        // konsisten dengan versi rekursif
        const neighbors = [...this.adjList.get(v)].reverse();
        for (const nb of neighbors) {
          if (!visited.has(nb)) stack.push(nb);
        }
      }
    }

    const elapsed = (performance.now() - startTime).toFixed(4);

    console.log('── DFS Iteratif (Stack Eksplisit) ──────');
    console.log(`  Start  : ${start}`);
    console.log(`  Urutan : ${result.join(' → ')}`);
    console.log(`  Waktu  : ${elapsed} ms`);
    console.log('────────────────────────────────────────\n');

    return result;
  }

  // ─────────────────────────────────────────────
  //  BFS: Cari Jalur Terpendek antara dua simpul
  // ─────────────────────────────────────────────
  shortestPath(start, end) {
    if (!this.adjList.has(start) || !this.adjList.has(end)) {
      console.error('shortestPath: simpul tidak ditemukan.');
      return null;
    }

    const visited = new Set();
    const queue   = [[start]];       // setiap elemen adalah jalur lengkap
    visited.add(start);

    while (queue.length > 0) {
      const path = queue.shift();
      const v    = path[path.length - 1];

      if (v === end) {
        console.log('── Jalur Terpendek (BFS) ───────────────');
        console.log(`  Dari  : ${start}  →  Ke  : ${end}`);
        console.log(`  Jalur : ${path.join(' → ')}`);
        console.log(`  Hop   : ${path.length - 1}`);
        console.log('────────────────────────────────────────\n');
        return path;
      }

      for (const nb of this.adjList.get(v)) {
        if (!visited.has(nb)) {
          visited.add(nb);
          queue.push([...path, nb]);
        }
      }
    }

    console.log(`Tidak ada jalur dari ${start} ke ${end}\n`);
    return null;
  }

  // ─────────────────────────────────────────────
  //  Deteksi Siklus menggunakan DFS
  // ─────────────────────────────────────────────
  hasCycle() {
    const visited = new Set();

    const dfsDetect = (v, parent) => {
      visited.add(v);
      for (const nb of this.adjList.get(v)) {
        if (!visited.has(nb)) {
          if (dfsDetect(nb, v)) return true;
        } else if (nb !== parent) {
          return true;   // ditemukan back-edge → siklus
        }
      }
      return false;
    };

    for (const v of this.adjList.keys()) {
      if (!visited.has(v)) {
        if (dfsDetect(v, null)) {
          console.log('── Deteksi Siklus (DFS) ────────────────');
          console.log('  Hasil: Graf MENGANDUNG siklus ✓');
          console.log('────────────────────────────────────────\n');
          return true;
        }
      }
    }

    console.log('── Deteksi Siklus (DFS) ────────────────');
    console.log('  Hasil: Graf TIDAK mengandung siklus');
    console.log('────────────────────────────────────────\n');
    return false;
  }

  // ─────────────────────────────────────────────
  //  Tabel Perbandingan Kinerja BFS vs DFS
  // ─────────────────────────────────────────────
  comparePerformance(start, runs = 100) {
    let totalBFS = 0;
    let totalDFS = 0;
    let bfsResult, dfsResult;

    for (let i = 0; i < runs; i++) {
      const t1 = performance.now();
      bfsResult = this._bfsSilent(start);
      totalBFS += performance.now() - t1;

      const t2 = performance.now();
      dfsResult = this._dfsSilent(start);
      totalDFS += performance.now() - t2;
    }

    const avgBFS = (totalBFS / runs).toFixed(4);
    const avgDFS = (totalDFS / runs).toFixed(4);
    const V = this.adjList.size;
    let E = 0;
    for (const nb of this.adjList.values()) E += nb.length;
    E /= 2; // undirected

    console.log('══════════════════════════════════════════════');
    console.log('  TABEL PERBANDINGAN KINERJA BFS vs DFS');
    console.log('══════════════════════════════════════════════');
    console.log(`  Dataset      : ${V} simpul, ${E} sisi`);
    console.log(`  Start        : ${start}  |  Runs: ${runs}x`);
    console.log('──────────────────────────────────────────────');
    console.log(`  Parameter              BFS          DFS`);
    console.log('──────────────────────────────────────────────');
    console.log(`  Rata-rata Waktu    ${String(avgBFS + ' ms').padStart(10)}   ${String(avgDFS + ' ms').padStart(10)}`);
    console.log(`  Iterasi (simpul)   ${String(bfsResult.length).padStart(10)}   ${String(dfsResult.length).padStart(10)}`);
    console.log(`  Kompleksitas Wkt   ${'O(V+E)'.padStart(10)}   ${'O(V+E)'.padStart(10)}`);
    console.log(`  Kompleksitas Ruang ${'O(V)'.padStart(10)}   ${'O(V)'.padStart(10)}`);
    console.log(`  Jaminan Terpendek  ${'Ya'.padStart(10)}   ${'Tidak'.padStart(10)}`);
    console.log(`  Struktur Data      ${'Queue'.padStart(10)}   ${'Stack/Rekursi'.padStart(10)}`);
    console.log('══════════════════════════════════════════════\n');
  }

  // Helper BFS/DFS tanpa output (untuk benchmark)
  _bfsSilent(start) {
    const visited = new Set([start]);
    const queue   = [start];
    const result  = [];
    while (queue.length > 0) {
      const v = queue.shift();
      result.push(v);
      for (const nb of this.adjList.get(v))
        if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
    }
    return result;
  }

  _dfsSilentHelper(v, visited, result) {
    visited.add(v); result.push(v);
    for (const nb of this.adjList.get(v))
      if (!visited.has(nb)) this._dfsSilentHelper(nb, visited, result);
  }

  _dfsSilent(start) {
    const visited = new Set();
    const result  = [];
    this._dfsSilentHelper(start, visited, result);
    return result;
  }
}

// ─────────────────────────────────────────────
//  Fungsi pembantu: buat dataset inline
//  (jalankan tanpa file eksternal)
// ─────────────────────────────────────────────
function buildDatasetInline(graph) {
  const edges = [
    ['A','B'], ['A','C'], ['A','D'],
    ['B','D'], ['B','E'], ['B','F'],
    ['C','F'], ['C','G'],
    ['D','H'], ['E','H'],
    ['F','G'], ['G','H']
  ];
  edges.forEach(([u, v]) => graph.addEdge(u, v));
  console.log('✔ Dataset dimuat secara inline (simulasi jaringan kota)');
  console.log(`  Simpul : ${graph.adjList.size}`);
  console.log(`  Sisi   : ${edges.length}\n`);
}

// ─────────────────────────────────────────────
//  MAIN — Jalankan semua demo
// ─────────────────────────────────────────────
(function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Graph Traversal — BFS & DFS (JavaScript)   ║');
  console.log('║   Kelompok 10 — STRUKTUR DATA B, INFOR 2026  ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  const g = new Graph();

  // ── Muat dataset ──────────────────────────
  // Pilih salah satu sesuai ketersediaan file:
  //   g.loadFromJSON('graph.json');
  //   g.loadFromCSV('edges.csv');
  buildDatasetInline(g);           // ← pakai ini jika tanpa file eksternal

  // ── Cetak adjacency list ──────────────────
  g.printGraph();

  // ── BFS dari simpul A ─────────────────────
  g.bfs('A');

  // ── DFS Rekursif dari simpul A ────────────
  g.dfs('A');

  // ── DFS Iteratif dari simpul A ────────────
  g.dfsIterative('A');

  // ── Jalur Terpendek A → H ─────────────────
  g.shortestPath('A', 'H');

  // ── Deteksi Siklus ────────────────────────
  g.hasCycle();

  // ── Tabel Perbandingan Kinerja ─────────────
  g.comparePerformance('A', 1000);

})();
