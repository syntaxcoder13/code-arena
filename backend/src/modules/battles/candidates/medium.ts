import { ProblemCandidate } from '../problem-candidate.types';

/**
 * Medium problems: two ideas to combine, or one idea with an ordering rule
 * that a first attempt gets wrong.
 */
export const MEDIUM_CANDIDATES: ProblemCandidate[] = [
  {
    slug: 'longest-unique-run',
    title: 'Longest Run Without Repeats',
    statement: `Find the longest stretch of a line with no repeated character.

**Input** — one line of text (possibly empty).
**Output** — the length of the longest substring in which every character is
different.

Spaces count as characters. \`abcabcbb\` gives \`3\`.`,
    language: 'javascript',
    difficulty: 'medium',
    starterCode: `const input = require('fs').readFileSync(0, 'utf8');

function solve(input) {
  // your code here
}

process.stdout.write(String(solve(input)));
`,
    inputs: [
      { input: 'abcabcbb', sample: true },
      { input: 'bbbbb', sample: true },
      { input: '' },
      { input: 'pwwkew' },
      { input: 'abcdef' },
      { input: 'a b a' },
      { input: 'tmmzuxt' },
      { input: 'dvdf' },
    ],
    solutions: [
      // A sliding window carrying the last position of each character
      `const text = require('fs').readFileSync(0, 'utf8').replace(/\\n$/, '');
const lastSeen = {};
let start = 0;
let best = 0;
for (let i = 0; i < text.length; i++) {
  const c = text[i];
  if (lastSeen[c] !== undefined && lastSeen[c] >= start) start = lastSeen[c] + 1;
  lastSeen[c] = i;
  if (i - start + 1 > best) best = i - start + 1;
}
process.stdout.write(String(best));`,
      // A different route: grow from every position until a repeat appears
      `const text = require('fs').readFileSync(0, 'utf8').replace(/\\n$/, '');
let best = 0;
for (let i = 0; i < text.length; i++) {
  const seen = {};
  let length = 0;
  for (let j = i; j < text.length; j++) {
    if (seen[text[j]]) break;
    seen[text[j]] = true;
    length++;
  }
  if (length > best) best = length;
}
process.stdout.write(String(best));`,
    ],
  },

  {
    slug: 'group-anagrams',
    title: 'Group the Anagrams',
    statement: `Group words that are rearrangements of each other.

**Input** — one line of lower case words separated by single spaces (possibly
empty).
**Output** — one line per group. Within a group the words are sorted
alphabetically and joined by single spaces. Groups are sorted by their first
word.

A word is an anagram of itself, so every word belongs to exactly one group.`,
    language: 'python',
    difficulty: 'medium',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: 'eat tea tan ate nat bat', sample: true },
      { input: 'abc cba', sample: true },
      { input: '' },
      { input: 'one' },
      { input: 'listen silent enlist tinsel' },
      { input: 'ab ba ab' },
      { input: 'zz zz aa' },
    ],
    solutions: [
      // Keyed by the sorted letters of each word
      `import sys
words = sys.stdin.read().split()
groups = {}
for word in words:
    key = "".join(sorted(word))
    groups.setdefault(key, []).append(word)
lines = []
for key in groups:
    lines.append(sorted(groups[key]))
lines.sort(key=lambda group: group[0])
sys.stdout.write("\\n".join(" ".join(group) for group in lines))`,
      // A different route: keyed by a count of each letter
      `import sys
words = sys.stdin.read().split()
groups = {}
for word in words:
    counts = [0] * 26
    for ch in word:
        counts[ord(ch) - 97] += 1
    key = tuple(counts)
    if key not in groups:
        groups[key] = []
    groups[key].append(word)
result = []
for key in groups:
    group = groups[key]
    group.sort()
    result.append(group)
result.sort(key=lambda g: g[0])
sys.stdout.write("\\n".join(" ".join(g) for g in result))`,
    ],
  },

  {
    slug: 'balanced-partition',
    title: 'Split the Bill',
    statement: `Decide whether a list can be split into two parts with equal sums.

**Input** — the first line is \`N\`, then \`N\` lines each holding one positive
integer.
**Output** — \`yes\` if the numbers can be divided into two groups whose sums are
equal, otherwise \`no\`.

Every number must go into exactly one group. An empty list can be split into
two empty groups, so \`0\` gives \`yes\`.`,
    language: 'python',
    difficulty: 'medium',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: '4\n1\n5\n11\n5', sample: true },
      { input: '3\n1\n2\n5', sample: true },
      { input: '0' },
      { input: '1\n2' },
      { input: '2\n3\n3' },
      { input: '6\n1\n1\n1\n1\n1\n1' },
      { input: '5\n2\n2\n3\n4\n5' },
    ],
    solutions: [
      // Reachable sums carried in a set
      `import sys
lines = sys.stdin.read().split()
n = int(lines[0]) if lines else 0
nums = [int(lines[i + 1]) for i in range(n)]
total = sum(nums)
if total % 2 != 0:
    sys.stdout.write("no")
else:
    target = total // 2
    reachable = set([0])
    for value in nums:
        reachable |= set(r + value for r in reachable if r + value <= target)
    sys.stdout.write("yes" if target in reachable else "no")`,
      // A different route: a boolean table filled from the bottom up
      `import sys
parts = sys.stdin.read().split()
n = int(parts[0]) if parts else 0
nums = [int(parts[i + 1]) for i in range(n)]
total = sum(nums)
if total % 2 == 1:
    sys.stdout.write("no")
else:
    half = total // 2
    table = [False] * (half + 1)
    table[0] = True
    for value in nums:
        for amount in range(half, value - 1, -1):
            if table[amount - value]:
                table[amount] = True
    sys.stdout.write("yes" if table[half] else "no")`,
    ],
  },

  {
    slug: 'roman-to-number',
    title: 'Roman Numerals',
    statement: `Turn a Roman numeral into a number.

**Input** — one line holding a valid Roman numeral in upper case.
**Output** — the number it represents.

The subtractive pairs are \`IV\`, \`IX\`, \`XL\`, \`XC\`, \`CD\` and \`CM\`.`,
    language: 'java',
    difficulty: 'medium',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // your code here
    }
}
`,
    inputs: [
      { input: 'XIV', sample: true },
      { input: 'MCMXCIV', sample: true },
      { input: 'I' },
      { input: 'MMMCMXCIX' },
      { input: 'XL' },
      { input: 'LVIII' },
      { input: 'CDXLIV' },
    ],
    solutions: [
      // Right to left, subtracting anything smaller than what follows it
      `import java.util.*;

public class Main {
    static int value(char c) {
        switch (c) {
            case 'I': return 1;
            case 'V': return 5;
            case 'X': return 10;
            case 'L': return 50;
            case 'C': return 100;
            case 'D': return 500;
            default: return 1000;
        }
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String s = scanner.next();
        int total = 0;
        for (int i = 0; i < s.length(); i++) {
            int here = value(s.charAt(i));
            if (i + 1 < s.length() && here < value(s.charAt(i + 1))) total -= here;
            else total += here;
        }
        System.out.print(total);
    }
}`,
      // A different route: match the longest token at each position
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String s = scanner.next();
        String[] tokens = {"CM", "CD", "XC", "XL", "IX", "IV", "M", "D", "C", "L", "X", "V", "I"};
        int[] amounts = {900, 400, 90, 40, 9, 4, 1000, 500, 100, 50, 10, 5, 1};
        int at = 0;
        int total = 0;
        while (at < s.length()) {
            for (int t = 0; t < tokens.length; t++) {
                if (s.startsWith(tokens[t], at)) {
                    total += amounts[t];
                    at += tokens[t].length();
                    break;
                }
            }
        }
        System.out.print(total);
    }
}`,
    ],
  },

  {
    slug: 'word-frequency-order',
    title: 'Most Common Words',
    statement: `Report how often each word appears, most common first.

**Input** — one line of lower case words separated by single spaces (possibly
empty).
**Output** — one line per distinct word, in the form \`word count\`, most
frequent first. Words with the same count are listed alphabetically.`,
    language: 'go',
    difficulty: 'medium',
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
      { input: 'the cat the dog the bird cat', sample: true },
      { input: 'b a b a c', sample: true },
      { input: '' },
      { input: 'one' },
      { input: 'z z y y x' },
      { input: 'apple banana apple cherry banana apple' },
      { input: 'same same same' },
    ],
    solutions: [
      // Counted into a map, then sorted by count and name
      `package main

import (
	"bufio"
	"fmt"
	"os"
	"sort"
	"strconv"
	"strings"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	counts := map[string]int{}
	for {
		var word string
		if _, err := fmt.Fscan(reader, &word); err != nil {
			break
		}
		counts[word]++
	}
	words := []string{}
	for word := range counts {
		words = append(words, word)
	}
	sort.Slice(words, func(i, j int) bool {
		if counts[words[i]] != counts[words[j]] {
			return counts[words[i]] > counts[words[j]]
		}
		return words[i] < words[j]
	})
	out := []string{}
	for _, word := range words {
		out = append(out, word+" "+strconv.Itoa(counts[word]))
	}
	fmt.Print(strings.Join(out, "\\n"))
}`,
      // A different route: sort the words first, then walk the runs
      `package main

import (
	"bufio"
	"fmt"
	"os"
	"sort"
	"strconv"
	"strings"
)

type pair struct {
	word  string
	count int
}

func main() {
	reader := bufio.NewReader(os.Stdin)
	words := []string{}
	for {
		var word string
		if _, err := fmt.Fscan(reader, &word); err != nil {
			break
		}
		words = append(words, word)
	}
	sort.Strings(words)
	pairs := []pair{}
	for i := 0; i < len(words); {
		j := i
		for j < len(words) && words[j] == words[i] {
			j++
		}
		pairs = append(pairs, pair{words[i], j - i})
		i = j
	}
	sort.SliceStable(pairs, func(i, j int) bool { return pairs[i].count > pairs[j].count })
	out := []string{}
	for _, p := range pairs {
		out = append(out, p.word+" "+strconv.Itoa(p.count))
	}
	fmt.Print(strings.Join(out, "\\n"))
}`,
    ],
  },
];
