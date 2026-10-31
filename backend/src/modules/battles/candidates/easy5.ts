import { ProblemCandidate } from '../problem-candidate.types';

/** Fifth batch, easy. */
export const EASY_CANDIDATES_5: ProblemCandidate[] = [
  {
    slug: 'count-substring',
    title: 'How Many Times',
    statement: `Count how often one piece of text appears inside another.

**Input** — two lines: the text, then the piece to look for. Either may be
empty.
**Output** — how many times the piece appears, counting from the left and
never letting two found copies overlap.

\`abababa\` holds \`aba\` twice, not three times, because the copies may not
share a character. An empty piece is found \`0\` times.`,
    language: 'javascript',
    difficulty: 'easy',
    starterCode: `const input = require('fs').readFileSync(0, 'utf8');

function solve(input) {
  // your code here
}

process.stdout.write(String(solve(input)));
`,
    inputs: [
      { input: 'abababa\naba', sample: true },
      { input: 'hello world\no', sample: true },
      { input: '\n' },
      { input: 'aaa\na' },
      { input: 'abc\nd' },
      { input: 'aaaa\naa' },
      { input: 'test\ntest' },
    ],
    solutions: [
      // Step along, jumping past each copy that is found
      `const lines = require('fs').readFileSync(0, 'utf8').split('\\n');
const text = lines[0] ?? '';
const piece = lines[1] ?? '';
let found = 0;
if (piece !== '') {
  let at = 0;
  while (at + piece.length <= text.length) {
    if (text.startsWith(piece, at)) {
      found++;
      at += piece.length;
    } else {
      at++;
    }
  }
}
process.stdout.write(String(found));`,
      // A different route: cut the text apart on the piece and count the gaps
      `const rows = require('fs').readFileSync(0, 'utf8').split('\\n');
const body = rows[0] ?? '';
const needle = rows[1] ?? '';
process.stdout.write(String(needle === '' ? 0 : body.split(needle).length - 1));`,
    ],
  },

  {
    slug: 'word-lengths',
    title: 'How Long Is Each',
    statement: `Report the length of every word.

**Input** — one line of words separated by single spaces (possibly empty).
**Output** — the length of each word in turn, separated by single spaces.`,
    language: 'python',
    difficulty: 'easy',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: 'hello world', sample: true },
      { input: 'one two three', sample: true },
      { input: '' },
      { input: 'a' },
      { input: 'x yy zzz' },
      { input: 'abcdef' },
      { input: 'a b c d e' },
    ],
    solutions: [
      // Ask each word how long it is
      `import sys
words = sys.stdin.read().split()
sys.stdout.write(" ".join(str(len(word)) for word in words))`,
      // A different route: count the characters of each word by hand
      `import sys
out = []
for word in sys.stdin.read().split():
    n = 0
    for _ in word:
        n += 1
    out.append(str(n))
sys.stdout.write(" ".join(out))`,
    ],
  },

  {
    slug: 'same-letters',
    title: 'Same Letters',
    statement: `Decide whether two words use exactly the same letters.

**Input** — two lines, each holding one lower case word (either may be empty).
**Output** — \`true\` if the second is a rearrangement of the first, otherwise
\`false\`.

Every letter must appear the same number of times in both.`,
    language: 'python',
    difficulty: 'easy',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: 'listen\nsilent', sample: true },
      { input: 'hello\nworld', sample: true },
      { input: '\n' },
      { input: 'a\na' },
      { input: 'ab\nba' },
      { input: 'aab\nabb' },
      { input: 'abc\nab' },
    ],
    solutions: [
      // Sorted letters are the same for any rearrangement
      `import sys
lines = sys.stdin.read().split("\\n")
first = lines[0].strip() if lines else ""
second = lines[1].strip() if len(lines) > 1 else ""
sys.stdout.write("true" if sorted(first) == sorted(second) else "false")`,
      // A different route: count each letter and compare the counts
      `import sys
rows = sys.stdin.read().split("\\n")
a = rows[0].strip() if rows else ""
b = rows[1].strip() if len(rows) > 1 else ""
counts = {}
for ch in a:
    counts[ch] = counts.get(ch, 0) + 1
for ch in b:
    counts[ch] = counts.get(ch, 0) - 1
same = all(v == 0 for v in counts.values())
sys.stdout.write("true" if same else "false")`,
    ],
  },

  {
    slug: 'reverse-the-digits',
    title: 'Reverse the Digits',
    statement: `Write a number with its digits the other way round.

**Input** — one integer, possibly negative.
**Output** — the same digits reversed, keeping the sign. Any zeros that end up
at the front are dropped.

\`-120\` gives \`-21\`.`,
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
      { input: '123', sample: true },
      { input: '-120', sample: true },
      { input: '0' },
      { input: '100' },
      { input: '-7' },
      { input: '1000000' },
      { input: '987654321' },
    ],
    solutions: [
      // Peel a digit off the end and push it onto the answer
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        long n = scanner.nextLong();
        boolean negative = n < 0;
        long left = Math.abs(n);
        long reversed = 0;
        while (left > 0) {
            reversed = reversed * 10 + left % 10;
            left /= 10;
        }
        System.out.print(negative ? -reversed : reversed);
    }
}`,
      // A different route: turn it into text, reverse that, read it back
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        long value = scanner.nextLong();
        boolean below = value < 0;
        String digits = String.valueOf(Math.abs(value));
        String flipped = new StringBuilder(digits).reverse().toString();
        long result = Long.parseLong(flipped);
        System.out.print(below ? -result : result);
    }
}`,
    ],
  },

  {
    slug: 'min-and-max',
    title: 'Smallest and Largest',
    statement: `Find the two ends of a list.

**Input** — one line of one or more integers separated by single spaces.
**Output** — the smallest and then the largest, separated by a single space.`,
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
      { input: '3 1 4 1 5', sample: true },
      { input: '7', sample: true },
      { input: '-1 -2 -3' },
      { input: '0 0' },
      { input: '10 20 30' },
      { input: '5 4 3 2 1' },
      { input: '-5 5' },
    ],
    solutions: [
      // Carry both ends while reading
      `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	smallest, largest := 0, 0
	first := true
	for {
		var n int
		if _, err := fmt.Fscan(reader, &n); err != nil {
			break
		}
		if first || n < smallest {
			smallest = n
		}
		if first || n > largest {
			largest = n
		}
		first = false
	}
	fmt.Print(smallest, " ", largest)
}`,
      // A different route: read them all, sort, and take the two ends
      `package main

import (
	"bufio"
	"fmt"
	"os"
	"sort"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	nums := []int{}
	for {
		var n int
		if _, err := fmt.Fscan(reader, &n); err != nil {
			break
		}
		nums = append(nums, n)
	}
	sort.Ints(nums)
	fmt.Print(nums[0], " ", nums[len(nums)-1])
}`,
    ],
  },
];
