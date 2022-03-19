export interface WordGraphBuilder {
  add(word: string): WordGraphBuilder;
  finish(): WordGraph;
}

export interface WordGraph {
  readonly nodesCount: number;
  readonly wordsCount: number;
  findPrefixes(input: string): string[];
  indexOf(input: string): number;
}

export function buildWordGraph(): WordGraphBuilder {
  return new Dawg();
}

class Dawg implements WordGraphBuilder, WordGraph {
  edgesCount = 0;
  nodesCount = 0;
  wordsCount = 0;
  private root: Node = this.createNode();
  private prevWord: string = '';
  private uncheckedNodes: UncheckedNode[] = [];
  private minimizedNodes = new Map<string, Node>();

  add(word: string): this {
    if (word < this.prevWord) {
      throw new Error('Words must be added in alphabetical order');
    }

    let commonPrefix = 0;
    for (let i = 0; i < Math.min(word.length, this.prevWord.length); i++) {
      if (word[i] !== this.prevWord[i]) break;
      commonPrefix += 1;
    }

    this.minimize(commonPrefix);

    let node: Node;
    if (this.uncheckedNodes.length === 0) node = this.root;
    else node = this.uncheckedNodes[this.uncheckedNodes.length - 1].child;

    for (const ch of word.slice(commonPrefix)) {
      const nextNode = this.createNode();
      this.edgesCount += 1;
      node.edges.push({ ch, child: nextNode });
      this.uncheckedNodes.push({ parent: node, child: nextNode, ch: ch });
      node = nextNode;
    }

    node.final = true;
    this.prevWord = word;

    return this;
  }

  finish(): WordGraph {
    this.minimize(0);
    this.wordsCount = this.root.finish();
    this.nodesCount = this.minimizedNodes.size;
    this.prevWord = '';
    this.uncheckedNodes = [];
    return this;
  }

  findPrefixes(input: string): string[] {
    let node = this.root;
    const prefixes: string[] = [];
    for (let i = 0; i < input.length; i += 1) {
      const { edge } = node.findEdge(input[i]);
      if (!edge) break;

      if (edge.child.final) prefixes.push(input.substring(0, i + 1));
      node = edge.child;
    }

    return prefixes;
  }

  indexOf(input: string): number {
    let node = this.root;
    let idx = 0;
    for (const ch of input) {
      const { edge, skipped } = node.findEdge(ch);
      if (!edge) return -1;

      node = edge.child;
      idx += skipped;
    }

    if (node.final) return idx;

    return -1;
  }

  at(index: number): string {
    if (this.root.finalNodesCount - 1 < index) {
      throw new Error('index out of bound');
    }

    return '';
  }

  private minimize(downTo: number): void {
    for (let i = this.uncheckedNodes.length - 1; i >= downTo; i--) {
      const { parent, child, ch } = this.uncheckedNodes[i];
      const key = child.createKey();
      const minimizedNode = this.minimizedNodes.get(key);
      if (minimizedNode) {
        const idx = parent.edges.findIndex((edge) => edge.ch === ch);
        parent.edges[idx].child = minimizedNode;
      } else this.minimizedNodes.set(key, child);

      this.uncheckedNodes.pop();
    }
  }

  private nodeId = 0;
  private createNode(): Node {
    this.nodeId += 1;
    return new Node(this.nodeId - 1);
  }
}

type Edge = { ch: string; child: Node };

class Node {
  edges: Array<{ ch: string; child: Node }> = [];
  final: boolean = false;
  finalNodesCount = -1;

  findEdge(ch: string): { edge?: Edge; skipped: number } {
    let skipped = this.final ? 1 : 0;
    for (const edge of this.edges) {
      if (edge.ch === ch) return { edge, skipped };
      skipped += edge.child.finalNodesCount;
    }

    return { skipped };
  }

  finish(): number {
    if (this.finalNodesCount >= 0) return this.finalNodesCount;

    this.finalNodesCount = this.edges.reduce(
      (count, { child }) => count + child.finish(),
      this.final ? 1 : 0
    );
    return this.finalNodesCount;
  }

  createKey(): string {
    let v = '';
    for (const { ch, child } of this.edges) {
      v += `_${ch}:${child.id}`;
    }

    if (this.final) v += '!';

    return v;
  }

  constructor(public id: number) {}
}

type UncheckedNode = {
  parent: Node;
  child: Node;
  ch: string;
};
