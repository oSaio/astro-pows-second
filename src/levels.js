// Shared by client and server: the server re-simulates every submission.
export const SECTIONS = { 1: 'Planet Starlight', 2: 'Nebula Prime', 3: 'Black Hole Core' };
export const LABEL = { move:'Move', left:'Turn Left', right:'Turn Right', collect:'Collect', jump:'Jetpack Jump', repeat:'Repeat', until:'Repeat Until Goal', if:'If', call:'Call jumpAndCollect()' };
export const COND = { red:'Red tile ahead? (then / else)', wall:'Asteroid ahead? (then / else)', item:'Item here? (then / else)' };
export const LEVELS = [
 { id:'1.1', sec:1, name:'Blast Off', icon:'🌠', credits:10, grid:['S..CG'], palette:['move','collect'], ideal:5, lim:8,
   how:'Sequencing: the computer follows your blocks in order, top to bottom. Pick up the crystal, then reach the portal G.' },
 { id:'1.2', sec:1, name:'Space Debris Dodge', icon:'☄️', credits:10, grid:['S#G','...'], palette:['move','left','right'], ideal:7, lim:10,
   how:'Turns change the way Captain Pixel faces. Moves always go the way the cat is facing (it starts facing right).' },
 { id:'1.3', sec:1, name:'Satellite Vault', icon:'🛰️', credits:10, grid:['S.K.D.G'], palette:['move','collect'], ideal:7, lim:10,
   how:'The order matters: collect the keycard K and the Energy Gate D opens. Without it, the gate blocks you.' },
 { id:'1.4', sec:1, name:'Asteroid Maze', icon:'🪐', credits:10, grid:['S.P##','.#.##','.#P.G'], palette:['move','left','right'], ideal:8, lim:12,
   how:'Plan the whole path before you build. Chips (P) are grabbed automatically when you fly over them.' },
 { id:'2.1', sec:2, name:'Hyper-Corridor', icon:'🌉', credits:10, grid:['S.......G'], palette:['move','repeat'], ideal:2, lim:3, req:['repeat'],
   how:'Loops: instead of repeating a block eight times, put it inside Repeat and set the number.' },
 { id:'2.2', sec:2, name:'Color-Tile Junction', icon:'🚦', credits:10, grid:['S.R..R.G'], palette:['move','jump','repeat','if'], cond:'red', ideal:4, lim:6, req:['repeat','if'],
   how:'If/else: the cat checks something, then picks one of two actions. Red tiles are hot, so jump over them.' },
 { id:'2.3', sec:2, name:'Cosmic Patrol', icon:'🧭', credits:10, grid:['S...#','###.#','###.#','.G..#'], palette:['move','right','until','if'], cond:'wall', ideal:4, lim:5, req:['until','if'],
   how:'Repeat Until Goal keeps going until you arrive. One rule (turn right at a wall, else move) can steer the whole corridor.' },
 { id:'2.4', sec:2, name:'Crystal Harvest', icon:'🔋', credits:10, grid:['S.B.B.B.G'], palette:['move','collect','repeat','if'], cond:'item', ideal:4, lim:6, req:['repeat','if'],
   how:'Sensors: ask "is there an item here?" every step, and collect only when the answer is yes.' },
 { id:'3.2', sec:3, name:'Subroutine Factory', icon:'🏭', credits:15, grid:['S.#C.#C.#C.G'], palette:['move','jump','collect','repeat','call'], ideal:7, lim:10, req:['call'],
   how:'Functions: write a mini-program once in the function box, then Call it as often as you like.' },
];
export const MAX_CREDITS = LEVELS.reduce((s, l) => s + l.credits, 0);
