import { ProblemCandidate } from '../problem-candidate.types';

/** Third batch, hard. */
export const HARD_CANDIDATES_3: ProblemCandidate[] = [
  {
    slug: 'wildcard-match',
    title: 'Match the Pattern',
    statement: `Decide whether a pattern matches a whole line.

**Input** — two lines: the text, then the pattern. Either may be empty.
**Output** — \`true\` or \`false\`.

In the pattern, \`.\` stands for any single character and \`*\` means the
character before it may appear any number of times, including none. The
pattern must match the whole text, not part of it.

\`aab\` against \`c*a*b\` is \`true\`.`,
    language: 'javascript',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `const input = require('fs').readFileSync(0, 'utf8');

function solve(input) {
  // your code here
}

process.stdout.write(String(solve(input)));
`,
    inputs: [
      { input: 'aab\nc*a*b', sample: true },
      { input: 'mississippi\nmis*is*p*.', sample: true },
      { input: '\n' },
      { input: 'abc\na.c' },
      { input: 'aaa\na*' },
      { input: 'ab\n.*' },
      { input: 'abc\nabcd' },
      { input: 'aa\na' },
    ],
    solutions: [
      // Recursion over both, remembering positions already settled
      `const lines = require('fs').readFileSync(0, 'utf8').split('\\n');
const text = lines[0] ?? '';
const pattern = lines[1] ?? '';
const seen = new Map();

function matches(t, p) {
  const key = t + ',' + p;
  if (seen.has(key)) return seen.get(key);
  let answer;
  if (p === pattern.length) {
    answer = t === text.length;
  } else {
    const here = t < text.length && (pattern[p] === '.' || pattern[p] === text[t]);
    if (p + 1 < pattern.length && pattern[p + 1] === '*') {
      answer = matches(t, p + 2) || (here && matches(t + 1, p));
    } else {
      answer = here && matches(t + 1, p + 1);
    }
  }
  seen.set(key, answer);
  return answer;
}

process.stdout.write(matches(0, 0) ? 'true' : 'false');`,
      // A different route: a table filled from the end backwards
      `const rows = require('fs').readFileSync(0, 'utf8').split('\\n');
const subject = rows[0] ?? '';
const rule = rows[1] ?? '';
const n = subject.length;
const m = rule.length;
const table = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(false));
table[n][m] = true;
for (let i = n; i >= 0; i--) {
  for (let j = m - 1; j >= 0; j--) {
    const here = i < n && (rule[j] === '.' || rule[j] === subject[i]);
    if (j + 1 < m && rule[j + 1] === '*') {
      table[i][j] = table[i][j + 2] || (here && table[i + 1][j]);
    } else {
      table[i][j] = here && table[i + 1][j + 1];
    }
  }
}
process.stdout.write(table[0][0] ? 'true' : 'false');`,
    ],
  },

  {
    slug: 'longest-palindrome-run',
    title: 'Longest Palindrome Inside',
    statement: `Find the longest stretch of a line that reads the same backwards.

**Input** — one line of text (possibly empty).
**Output** — the longest substring that reads the same in both directions.

Every character counts, including spaces. Where two are equally long, print
the one that starts earliest.`,
    language: 'python',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: 'babad', sample: true },
      { input: 'cbbd', sample: true },
      { input: '' },
      { input: 'a' },
      { input: 'abcde' },
      { input: 'forgeeksskeegfor' },
      { input: 'aaaa' },
    ],
    solutions: [
      // Grow outwards from every centre
      `import sys
text = sys.stdin.read().rstrip("\\n")
best_start = 0
best_length = 0 if text == "" else 1

def grow(left, right):
    while left >= 0 and right < len(text) and text[left] == text[right]:
        left -= 1
        right += 1
    return left + 1, right - left - 1

for centre in range(len(text)):
    for start, length in (grow(centre, centre), grow(centre, centre + 1)):
        if length > best_length:
            best_length = length
            best_start = start

sys.stdout.write(text[best_start:best_start + best_length])`,
      // A different route: a table saying which stretches read both ways
      `import sys
line = sys.stdin.read().rstrip("\\n")
n = len(line)
if n == 0:
    sys.stdout.write("")
else:
    same = [[False] * n for _ in range(n)]
    start = 0
    length = 1
    for i in range(n):
        same[i][i] = True
    for width in range(2, n + 1):
        for i in range(n - width + 1):
            j = i + width - 1
            if line[i] == line[j] and (width == 2 or same[i + 1][j - 1]):
                same[i][j] = True
                if width > length:
                    start = i
                    length = width
    sys.stdout.write(line[start:start + length])`,
    ],
  },

  {
    slug: 'equal-piles',
    title: 'Equal Piles',
    statement: `Decide whether a set of numbers splits into equal piles.

**Input** — the first line is \`K\`, the second line is positive integers
separated by single spaces.
**Output** — \`yes\` if the numbers can be divided into exactly \`K\` groups that
each add up to the same total, otherwise \`no\`.

Every number must go into exactly one group, and no group may be left empty.`,
    language: 'python',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: '4\n4 3 2 3 5 2 1', sample: true },
      { input: '3\n1 2 3 4', sample: true },
      { input: '1\n5 5 5' },
      { input: '2\n1 1' },
      { input: '2\n1 2' },
      { input: '3\n2 2 2 2 2 2' },
      { input: '5\n1 1 1 1' },
    ],
    solutions: [
      // Fill one pile at a time, backing out when it cannot be finished
      `import sys
rows = sys.stdin.read().split("\\n")
k = int(rows[0].strip())
nums = [int(x) for x in rows[1].split()] if len(rows) > 1 and rows[1].strip() else []
total = sum(nums)
if k <= 0 or len(nums) < k or total % k != 0:
    sys.stdout.write("no")
else:
    target = total // k
    nums.sort(reverse=True)
    if nums and nums[0] > target:
        sys.stdout.write("no")
    else:
        piles = [0] * k
        def place(i):
            if i == len(nums):
                return True
            tried = set()
            for p in range(k):
                if piles[p] + nums[i] > target or piles[p] in tried:
                    continue
                tried.add(piles[p])
                piles[p] += nums[i]
                if place(i + 1):
                    return True
                piles[p] -= nums[i]
            return False
        sys.stdout.write("yes" if place(0) else "no")`,
      // A different route: mark which subsets can be carved off, over bitmasks
      `import sys
lines = sys.stdin.read().split("\\n")
groups = int(lines[0].strip())
values = [int(x) for x in lines[1].split()] if len(lines) > 1 and lines[1].strip() else []
whole = sum(values)
n = len(values)
if groups <= 0 or n < groups or whole % groups != 0:
    sys.stdout.write("no")
else:
    each = whole // groups
    if values and max(values) > each:
        sys.stdout.write("no")
    else:
        reachable = [False] * (1 << n)
        reachable[0] = True
        carried = [0] * (1 << n)
        for mask in range(1 << n):
            if not reachable[mask]:
                continue
            for i in range(n):
                if mask & (1 << i):
                    continue
                if carried[mask] + values[i] > each:
                    continue
                nxt = mask | (1 << i)
                if not reachable[nxt]:
                    reachable[nxt] = True
                    carried[nxt] = (carried[mask] + values[i]) % each
        sys.stdout.write("yes" if reachable[(1 << n) - 1] else "no")`,
    ],
  },

  {
    slug: 'cache-evictions',
    title: 'What the Cache Kept',
    statement: `Run a small cache that forgets whatever was used longest ago.

**Input** — the first line is the cache size, the second line is \`N\`, then
\`N\` lines of commands. A command is either \`put key value\` or \`get key\`.
**Output** — one line for each \`get\`, holding the value, or \`-1\` if that key
is not held.

Both \`put\` and \`get\` count as using a key. When the cache is full, storing a
new key forgets whichever key was used longest ago.`,
    language: 'java',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        int capacity = Integer.parseInt(reader.readLine().trim());
        int n = Integer.parseInt(reader.readLine().trim());
        // your code here
    }
}
`,
    inputs: [
      {
        input: '2\n8\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nput 4 4\nget 1\nget 3',
        sample: true,
      },
      { input: '1\n4\nput 1 10\nget 1\nput 2 20\nget 1', sample: true },
      { input: '2\n1\nget 5' },
      { input: '3\n5\nput 1 1\nput 2 2\nput 3 3\nget 1\nget 2' },
      { input: '2\n5\nput 1 1\nput 1 9\nget 1\nput 2 2\nget 1' },
      { input: '1\n3\nput 7 7\nget 7\nget 8' },
      { input: '2\n6\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 3\nget 2' },
    ],
    solutions: [
      // A map that remembers the order keys were used
      `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        int capacity = Integer.parseInt(reader.readLine().trim());
        int n = Integer.parseInt(reader.readLine().trim());
        LinkedHashMap<Integer, Integer> cache = new LinkedHashMap<>();
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < n; i++) {
            String[] parts = reader.readLine().trim().split("\\\\s+");
            if (parts[0].equals("put")) {
                int key = Integer.parseInt(parts[1]);
                int value = Integer.parseInt(parts[2]);
                if (cache.containsKey(key)) cache.remove(key);
                else if (cache.size() >= capacity) {
                    Integer oldest = cache.keySet().iterator().next();
                    cache.remove(oldest);
                }
                cache.put(key, value);
            } else {
                int key = Integer.parseInt(parts[1]);
                if (cache.containsKey(key)) {
                    int value = cache.remove(key);
                    cache.put(key, value);
                    out.append(value);
                } else {
                    out.append(-1);
                }
                out.append("\\n");
            }
        }
        System.out.print(out.toString().trim());
    }
}`,
      // A different route: plain maps, with a counter saying when each key was
      // last touched
      `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        int capacity = Integer.parseInt(reader.readLine().trim());
        int commands = Integer.parseInt(reader.readLine().trim());
        Map<Integer, Integer> values = new HashMap<>();
        Map<Integer, Integer> lastUsed = new HashMap<>();
        List<String> results = new ArrayList<>();
        int clock = 0;
        for (int i = 0; i < commands; i++) {
            String[] parts = reader.readLine().trim().split("\\\\s+");
            clock++;
            if (parts[0].equals("put")) {
                int key = Integer.parseInt(parts[1]);
                int value = Integer.parseInt(parts[2]);
                if (!values.containsKey(key) && values.size() >= capacity) {
                    int oldestKey = -1;
                    int oldestTime = Integer.MAX_VALUE;
                    for (Map.Entry<Integer, Integer> e : lastUsed.entrySet()) {
                        if (e.getValue() < oldestTime) {
                            oldestTime = e.getValue();
                            oldestKey = e.getKey();
                        }
                    }
                    values.remove(oldestKey);
                    lastUsed.remove(oldestKey);
                }
                values.put(key, value);
                lastUsed.put(key, clock);
            } else {
                int key = Integer.parseInt(parts[1]);
                if (values.containsKey(key)) {
                    lastUsed.put(key, clock);
                    results.add(String.valueOf(values.get(key)));
                } else {
                    results.add("-1");
                }
            }
        }
        System.out.print(String.join("\\n", results));
    }
}`,
    ],
  },

  {
    slug: 'count-inversions',
    title: 'Out of Order',
    statement: `Count how far a list is from being sorted.

**Input** — one line of integers separated by single spaces (possibly empty).
**Output** — how many pairs are out of order, meaning an earlier number is
larger than a later one.

\`2 4 1 3 5\` has three such pairs.`,
    language: 'go',
    difficulty: 'hard',
    timeLimitMs: 3000,
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
      { input: '2 4 1 3 5', sample: true },
      { input: '5 4 3 2 1', sample: true },
      { input: '' },
      { input: '1' },
      { input: '1 2 3 4 5' },
      { input: '3 3 3' },
      { input: '1 3 2 3 1' },
    ],
    solutions: [
      // Count them while merging the halves back together
      `package main

import (
	"bufio"
	"fmt"
	"os"
)

var count int64

func sortAndCount(values []int) []int {
	if len(values) < 2 {
		return values
	}
	middle := len(values) / 2
	left := sortAndCount(values[:middle])
	right := sortAndCount(values[middle:])
	merged := make([]int, 0, len(values))
	i, j := 0, 0
	for i < len(left) && j < len(right) {
		if left[i] <= right[j] {
			merged = append(merged, left[i])
			i++
		} else {
			// everything still on the left is larger than this one
			count += int64(len(left) - i)
			merged = append(merged, right[j])
			j++
		}
	}
	merged = append(merged, left[i:]...)
	merged = append(merged, right[j:]...)
	return merged
}

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
	sortAndCount(nums)
	fmt.Print(count)
}`,
      // A different route: look at every pair
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
	var total int64
	for i := 0; i < len(values); i++ {
		for j := i + 1; j < len(values); j++ {
			if values[i] > values[j] {
				total++
			}
		}
	}
	fmt.Print(total)
}`,
    ],
  },
];
