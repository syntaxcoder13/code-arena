import { ProblemCandidate } from '../problem-candidate.types';

/** Fourth batch, easy. */
export const EASY_CANDIDATES_4: ProblemCandidate[] = [
  {
    slug: 'longest-word',
    title: 'The Longest Word',
    statement: `Find the longest word in a line.

**Input** — one line of words separated by single spaces (possibly empty).
**Output** — the longest of them.

Where two are equally long, print the one that comes first.`,
    language: 'javascript',
    difficulty: 'easy',
    starterCode: `const input = require('fs').readFileSync(0, 'utf8');

function solve(input) {
  // your code here
}

process.stdout.write(String(solve(input)));
`,
    inputs: [
      { input: 'the quick brown fox', sample: true },
      { input: 'hello world wide web', sample: true },
      { input: '' },
      { input: 'one' },
      { input: 'a bb ccc' },
      { input: 'aa bb' },
      { input: 'x yy zzz yy' },
    ],
    solutions: [
      // Keep the best seen so far, replacing only on a strictly longer word
      `const words = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).filter((w) => w !== '');
let best = '';
for (const word of words) {
  if (word.length > best.length) best = word;
}
process.stdout.write(best);`,
      // A different route: sort by length, longest first, and take the head.
      // The sort is stable, so equal lengths keep their original order.
      `const line = require('fs').readFileSync(0, 'utf8').trim();
const parts = line === '' ? [] : line.split(/\\s+/);
const sorted = [...parts].sort((a, b) => b.length - a.length);
process.stdout.write(sorted.length > 0 ? sorted[0] : '');`,
    ],
  },

  {
    slug: 'sort-by-length',
    title: 'Shortest First',
    statement: `Put words in order of length.

**Input** — one line of lower case words separated by single spaces (possibly
empty).
**Output** — the same words, shortest first, separated by single spaces.

Words of the same length go in alphabetical order.`,
    language: 'python',
    difficulty: 'easy',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: 'banana kiwi fig apple', sample: true },
      { input: 'bb aa cc', sample: true },
      { input: '' },
      { input: 'one' },
      { input: 'a bb a' },
      { input: 'zz yy x' },
      { input: 'abc ab a' },
    ],
    solutions: [
      // Sort on length, then on the word itself
      `import sys
words = sys.stdin.read().split()
words.sort(key=lambda w: (len(w), w))
sys.stdout.write(" ".join(words))`,
      // A different route: place each word where it belongs, one at a time
      `import sys
incoming = sys.stdin.read().split()
ordered = []
for word in incoming:
    at = 0
    while at < len(ordered):
        other = ordered[at]
        if len(other) > len(word) or (len(other) == len(word) and other > word):
            break
        at += 1
    ordered.insert(at, word)
sys.stdout.write(" ".join(ordered))`,
    ],
  },

  {
    slug: 'first-of-each',
    title: 'Only the First',
    statement: `Drop repeated words, keeping the first of each.

**Input** — one line of lower case words separated by single spaces (possibly
empty).
**Output** — the same words with later repeats removed, in the order they
first appeared, separated by single spaces.`,
    language: 'python',
    difficulty: 'easy',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: 'a b a c b', sample: true },
      { input: 'one one one', sample: true },
      { input: '' },
      { input: 'x' },
      { input: 'p q r' },
      { input: 'z y z y z' },
      { input: 'aa aa bb aa' },
    ],
    solutions: [
      // Remember what has been seen
      `import sys
seen = set()
out = []
for word in sys.stdin.read().split():
    if word not in seen:
        seen.add(word)
        out.append(word)
sys.stdout.write(" ".join(out))`,
      // A different route: ask the answer so far whether it already holds it
      `import sys
kept = []
for word in sys.stdin.read().split():
    already = False
    for other in kept:
        if other == word:
            already = True
            break
    if not already:
        kept.append(word)
sys.stdout.write(" ".join(kept))`,
    ],
  },

  {
    slug: 'count-set-bits',
    title: 'Count the Ones',
    statement: `Count the one bits in a number.

**Input** — one integer between 0 and 1000000000.
**Output** — how many \`1\` bits it has when written in binary.

\`7\` is \`111\`, so the answer is \`3\`.`,
    language: 'java',
    difficulty: 'easy',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        long n = scanner.nextLong();
        // your code here
    }
}
`,
    inputs: [
      { input: '7', sample: true },
      { input: '8', sample: true },
      { input: '0' },
      { input: '1' },
      { input: '255' },
      { input: '1023' },
      { input: '1000000000' },
    ],
    solutions: [
      // Clear the lowest set bit, over and over
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        long n = scanner.nextLong();
        int ones = 0;
        while (n != 0) {
            n = n & (n - 1);
            ones++;
        }
        System.out.print(ones);
    }
}`,
      // A different route: write it out in binary and count the characters
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        long value = scanner.nextLong();
        String bits = Long.toBinaryString(value);
        int total = 0;
        for (int i = 0; i < bits.length(); i++) {
            if (bits.charAt(i) == '1') total++;
        }
        System.out.print(total);
    }
}`,
    ],
  },

  {
    slug: 'alternating-sum',
    title: 'Plus, Minus, Plus',
    statement: `Add and subtract numbers in turn.

**Input** — one line of integers separated by single spaces (possibly empty).
**Output** — the first number, minus the second, plus the third, and so on.

An empty line gives \`0\`.`,
    language: 'go',
    difficulty: 'easy',
    starterCode: `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	_ = reader
	fmt.Print("")
}
`,
    inputs: [
      { input: '1 2 3 4', sample: true },
      { input: '2 4 6 8 10', sample: true },
      { input: '' },
      { input: '5' },
      { input: '1 1 1 1 1' },
      { input: '10 5' },
      { input: '-1 -2 -3' },
    ],
    solutions: [
      // Flip the sign each time round
      `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	total := 0
	sign := 1
	for {
		var n int
		if _, err := fmt.Fscan(reader, &n); err != nil {
			break
		}
		total += sign * n
		sign = -sign
	}
	fmt.Print(total)
}`,
      // A different route: add the ones in even places, take away the rest
      `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	values := []int{}
	for {
		var n int
		if _, err := fmt.Fscan(reader, &n); err != nil {
			break
		}
		values = append(values, n)
	}
	added, taken := 0, 0
	for i, v := range values {
		if i%2 == 0 {
			added += v
		} else {
			taken += v
		}
	}
	fmt.Print(added - taken)
}`,
    ],
  },
];
