// Client-side implementation of Thompson's construction and subset construction
// Exactly matches the C++ / Python backend.

const EPSILON = '\u03B5';
const MAX_PATTERN_LENGTH = 200;

function isAllowedChar(c) {
  return /^[a-zA-Z0-9|*+?()]$/.test(c);
}

class NFA {
  constructor() {
    this.stateCount = 0;
    this.start = -1;
    this.accept = [];
    this.edges = [];
    this.steps = [];
  }
  newState() {
    return this.stateCount++;
  }
  addEdge(from, to, symbol) {
    this.edges.push({ from, to, symbol });
  }
  alphabet() {
    const s = new Set();
    for (const e of this.edges) {
      if (e.symbol !== EPSILON) s.add(e.symbol);
    }
    return Array.from(s).sort();
  }
  toJSON() {
    return {
      states: Array.from({ length: this.stateCount }, (_, i) => i),
      start: this.start,
      accept: this.accept,
      alphabet: this.alphabet(),
      transitions: this.edges,
      steps: this.steps
    };
  }
}

class RegexParser {
  constructor(pattern) {
    this.src = pattern;
    this.pos = 0;
    this.nfa = new NFA();
  }

  static convert(pattern) {
    if (!pattern) throw new Error("Pattern must not be empty.");
    if (pattern.length > MAX_PATTERN_LENGTH) throw new Error(`Pattern is too long (max ${MAX_PATTERN_LENGTH} characters).`);
    for (const c of pattern) {
      if (!isAllowedChar(c)) throw new Error(`Unsupported character '${c}'. Allowed: letters, digits, | * + ? ( )`);
    }
    const parser = new RegexParser(pattern);
    return parser.build();
  }

  build() {
    this.nfa.steps.push(`Parsing pattern "${this.src}" into an NFA using Thompson's construction.`);
    const frag = this.parseExpr();
    if (!this.atEnd()) throw new Error(`Unexpected character '${this.peek()}' at position ${this.pos}.`);
    this.nfa.start = frag.start;
    this.nfa.accept = [frag.accept];
    this.nfa.steps.push(`Final NFA: start state q${this.nfa.start}, accepting state q${frag.accept}.`);
    return this.nfa;
  }

  peek() {
    if (this.atEnd()) throw new Error("Unexpected end of pattern.");
    return this.src[this.pos];
  }
  get() {
    return this.src[this.pos++];
  }
  atEnd() {
    return this.pos >= this.src.length;
  }

  parseExpr() {
    let left = this.parseTerm();
    while (!this.atEnd() && this.peek() === '|') {
      this.get();
      const right = this.parseTerm();
      left = this.unionFrag(left, right);
    }
    return left;
  }

  parseTerm() {
    if (this.atEnd() || this.peek() === '|' || this.peek() === ')') {
      throw new Error(`Expected an operand at position ${this.pos}.`);
    }
    let left = this.parseFactor();
    while (!this.atEnd() && this.peek() !== '|' && this.peek() !== ')') {
      const right = this.parseFactor();
      left = this.concatFrag(left, right);
    }
    return left;
  }

  parseFactor() {
    let f = this.parseBase();
    while (!this.atEnd() && (this.peek() === '*' || this.peek() === '+' || this.peek() === '?')) {
      const op = this.get();
      if (op === '*') f = this.starFrag(f);
      else if (op === '+') f = this.plusFrag(f);
      else f = this.optionalFrag(f);
    }
    return f;
  }

  parseBase() {
    if (this.atEnd()) throw new Error("Unexpected end of pattern; expected an operand.");
    const c = this.peek();
    if (c === '(') {
      this.get();
      const inner = this.parseExpr();
      if (this.atEnd() || this.peek() != ')') {
        throw new Error("Missing closing ')' for group opened earlier in the pattern.");
      }
      this.get();
      return inner;
    }
    if (['*', '+', '?', '|', ')'].includes(c)) {
      throw new Error(`Operator '${c}' at position ${this.pos} has no operand.`);
    }
    this.get();
    return this.literalFrag(c);
  }

  literalFrag(c) {
    const s = this.nfa.newState();
    const a = this.nfa.newState();
    this.nfa.addEdge(s, a, c);
    this.nfa.steps.push(`Literal '${c}': created q${s} --${c}--> q${a}.`);
    return { start: s, accept: a };
  }

  concatFrag(a, b) {
    this.nfa.addEdge(a.accept, b.start, EPSILON);
    this.nfa.steps.push(`Concatenation: linked q${a.accept} to q${b.start} with an epsilon-transition.`);
    return { start: a.start, accept: b.accept };
  }

  unionFrag(a, b) {
    const s = this.nfa.newState();
    const f = this.nfa.newState();
    this.nfa.addEdge(s, a.start, EPSILON);
    this.nfa.addEdge(s, b.start, EPSILON);
    this.nfa.addEdge(a.accept, f, EPSILON);
    this.nfa.addEdge(b.accept, f, EPSILON);
    this.nfa.steps.push(`Union (|): new start q${s} branches to q${a.start} and q${b.start}; both rejoin at q${f}.`);
    return { start: s, accept: f };
  }

  starFrag(a) {
    const s = this.nfa.newState();
    const f = this.nfa.newState();
    this.nfa.addEdge(s, a.start, EPSILON);
    this.nfa.addEdge(s, f, EPSILON);
    this.nfa.addEdge(a.accept, a.start, EPSILON);
    this.nfa.addEdge(a.accept, f, EPSILON);
    this.nfa.steps.push(`Kleene star (*): q${s} can skip straight to q${f} or loop back through q${a.start} any number of times.`);
    return { start: s, accept: f };
  }

  plusFrag(a) {
    const f = this.nfa.newState();
    this.nfa.addEdge(a.accept, a.start, EPSILON);
    this.nfa.addEdge(a.accept, f, EPSILON);
    this.nfa.steps.push(`One-or-more (+): q${a.accept} may repeat back to q${a.start} or finish at q${f}.`);
    return { start: a.start, accept: f };
  }

  optionalFrag(a) {
    this.nfa.addEdge(a.start, a.accept, EPSILON);
    this.nfa.steps.push(`Optional (?): added a direct epsilon-transition from q${a.start} to q${a.accept} so the piece may be skipped.`);
    return a;
  }
}

function setLabel(arr) {
  return '{' + arr.slice().sort((a,b)=>a-b).map(q => 'q' + q).join(',') + '}';
}

function epsilonClosure(nfa, states) {
  const set = new Set(states);
  const stack = [...states];
  while (stack.length > 0) {
    const s = stack.pop();
    for (const e of nfa.edges) {
      if (e.from === s && e.symbol === EPSILON && !set.has(e.to)) {
        set.add(e.to);
        stack.push(e.to);
      }
    }
  }
  return Array.from(set).sort((a,b)=>a-b);
}

function moveStates(nfa, states, sym) {
  const res = new Set();
  const st = new Set(states);
  for (const e of nfa.edges) {
    if (e.symbol === sym && st.has(e.from)) {
      res.add(e.to);
    }
  }
  return Array.from(res).sort((a,b)=>a-b);
}

function nfaToDfa(nfa) {
  const alphabet = nfa.alphabet();
  const steps = ["Building the DFA from the NFA using the subset construction (each DFA state is a set of NFA states)."];

  const idOf = new Map();
  const stateLabels = [];
  const edges = [];
  const accept = new Set();

  function key(arr) {
    return arr.join(',');
  }

  const startSet = epsilonClosure(nfa, [nfa.start]);
  const startId = 0;
  idOf.set(key(startSet), startId);
  stateLabels.push(startSet);
  let stateCount = 1;

  steps.push(`Start state: epsilon-closure of NFA start q${nfa.start} = ${setLabel(startSet)}, labeled D${startId}.`);

  const pending = [startSet];
  let idx = 0;
  const acceptSet = new Set(nfa.accept);

  while (idx < pending.length) {
    const curr = pending[idx++];
    const currId = idOf.get(key(curr));

    if (curr.some(q => acceptSet.has(q))) {
      accept.add(currId);
    }

    for (const sym of alphabet) {
      const moved = moveStates(nfa, curr, sym);
      if (moved.length === 0) continue;
      const closure = epsilonClosure(nfa, moved);
      const k = key(closure);
      const isNew = !idOf.has(k);
      let targetId;
      if (isNew) {
        targetId = stateCount++;
        idOf.set(k, targetId);
        stateLabels.push(closure);
        pending.push(closure);
      } else {
        targetId = idOf.get(k);
      }

      edges.push({ from: currId, to: targetId, symbol: sym });
      steps.push(
        `From D${currId} ${setLabel(curr)} on '${sym}': move + epsilon-closure = ${setLabel(closure)}` +
        (isNew ? `, a new DFA state D${targetId}.` : `, already known as D${targetId}.`)
      );
    }
  }

  const acceptList = Array.from(accept).sort((a,b)=>a-b);
  const accStr = acceptList.length > 0 ? acceptList.map(a => `D${a}`).join(', ') : 'none';
  steps.push(`Final DFA has ${stateCount} state(s); accepting state(s): ${accStr}.`);

  const labelsMap = {};
  for (let i = 0; i < stateCount; i++) {
    labelsMap[String(i)] = setLabel(stateLabels[i]);
  }

  return {
    states: Array.from({ length: stateCount }, (_, i) => i),
    stateLabels: labelsMap,
    start: startId,
    accept: acceptList,
    transitions: edges,
    steps: steps
  };
}

export function convertRegexClient(pattern) {
  const nfa = RegexParser.convert(pattern);
  const dfa = nfaToDfa(nfa);
  return {
    regex: pattern,
    nfa: nfa.toJSON(),
    dfa: dfa
  };
}
