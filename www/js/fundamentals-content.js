// Fundamentals for the software engineering tech screening (#/code/screening/fundamentals): computer
// architecture, memory, concurrency and networking, each as "the physical reality → the constraint
// it creates → the design choices it leads to", with likely questions and model answers, and a
// self-check. Latency figures are orders of magnitude for a modern x86 server; they vary by hardware,
// so learn the ratios. Numeric checks are re-derived in research/verify_fundamentals.py.
(function () {
  const LATENCY = [
    ['One CPU cycle (3–4 GHz)', '0.3 ns', 'The unit everything else is measured in'],
    ['L1 cache hit', '~1 ns', 'About 4 cycles; 32–48 KB per core'],
    ['Branch mispredicted', '~5 ns', 'The pipeline is thrown away: 15–20 cycles'],
    ['L2 cache hit', '~4 ns', 'About 12 cycles; 1–2 MB per core'],
    ['L3 cache hit', '~10–20 ns', 'Shared by the cores on a chip; tens of MB'],
    ['Uncontended mutex lock and unlock', '~20 ns', 'Just atomic instructions, no system call'],
    ['Main memory (DRAM) access', '~80–100 ns', '100× an L1 hit: why cache misses dominate'],
    ['System call', '~0.1–1 µs', 'Crossing into the kernel and back'],
    ['Thread context switch', '~2–5 µs', 'Plus the cost of refilling cold caches afterwards'],
    ['Send 1,500 bytes on a 10 Gb/s link', '1.2 µs', 'Serialisation time: bits on the wire'],
    ['Round trip in a data centre, kernel TCP', '~10–50 µs', '~1–5 µs with kernel bypass'],
    ['NVMe SSD random read', '~20–100 µs', 'A spinning disk seek is ~5–10 ms'],
    ['Light in optical fibre', '5 µs per km', 'About two-thirds of the speed of light in vacuum'],
    ['Round trip London ↔ New York', '~60–70 ms', 'Physics: no software can beat it'],
  ];

  const TOPICS = [
    {
      id: 'architecture', title: 'Computer architecture',
      blurb: 'Caches, cache lines, branch prediction and cores: why the same big-O can run 10× faster or slower.',
      reality: `<p>A CPU core can do several operations per nanosecond, but fetching data from main memory takes about 100 ns. To hide that gap, chips have a hierarchy of small, fast <b>caches</b> (L1, L2, L3) holding recently used data. Memory moves between them in <b>cache lines</b> of 64 bytes, never single bytes, and the hardware <b>prefetches</b> the next lines when it sees you reading sequentially.</p>
        <p>Cores also run ahead: they keep a pipeline of instructions in flight and <b>predict which way each branch will go</b>. A wrong guess throws away 15–20 cycles of work. Clock speeds stopped rising around 2005 (heat), so extra performance now comes from more cores and from <b>SIMD</b> instructions that process 4–16 numbers at once.</p>`,
      constraints: `<ul><li><b>Memory access patterns matter more than operation counts.</b> Walking an array in order uses every byte of each 64-byte line and lets the prefetcher run ahead; following pointers to scattered nodes can cost a full DRAM trip per step.</li>
        <li><b>The working set should fit in cache.</b> Code that touches 10 MB in a tight loop behaves very differently from code that touches 100 KB.</li>
        <li><b>Unpredictable branches are expensive</b> in hot loops; predictable ones are almost free.</li>
        <li><b>Parallelism isn't free:</b> cores share the L3 cache and the memory bus, and must keep their caches consistent with each other.</li></ul>`,
      design: `<ul><li><b>Arrays over linked structures:</b> a vector of structs, a ring buffer, or a price-indexed array for a book in a narrow price band beats a tree of heap-allocated nodes, even when big-O says otherwise.</li>
        <li><b>Data laid out by how it's used:</b> keep the fields read together in one cache line ("hot" fields), and consider structure-of-arrays (one array per field) when a loop reads one field across many records.</li>
        <li><b>Pin hot threads to dedicated cores</b> so their caches stay warm and nothing else gets scheduled there; keep logging and housekeeping on other cores.</li>
        <li><b>Branch-light hot paths:</b> handle the common case first and move rare cases (errors, unusual message types) out of the way.</li></ul>`,
      questions: [
        ['Two loops sum every element of a 10,000 × 10,000 matrix of doubles, one row by row and one column by column. Both are O(n²). Why can one be ten times slower?',
          `<p><b>The idea.</b> The matrix is stored row by row (in C, C++, NumPy by default), and memory arrives in 64-byte cache lines, 8 doubles each.</p>
          <p><b>Row by row,</b> consecutive reads are next to each other: one cache miss brings in 8 useful values, and the prefetcher sees the pattern and fetches ahead. <b>Column by column,</b> consecutive reads are 80,000 bytes apart: every read lands on a different line, uses 8 of its 64 bytes, and the lines are evicted before you come back for the next column. So nearly every access is a miss.</p>
          <p><b>The point to make:</b> big-O counts operations; real cost depends on memory access patterns. The fix is to loop in storage order, or to block (tile) the computation so each tile fits in cache.</p>`],
        ['What is false sharing, and how do you fix it?',
          `<p><b>The idea.</b> Caches keep cores consistent per cache line, not per variable. If two threads write two <i>different</i> variables that happen to sit in the same 64-byte line, each write invalidates the other core's copy, and the line bounces between cores.</p>
          <p><b>Example.</b> Two threads each increment their own counter in <code>counts[0]</code> and <code>counts[1]</code>. They never touch each other's data, yet the program can run several times slower than with one thread.</p>
          <p><b>Fix:</b> put data written by different threads on different cache lines, by padding or aligning each to 64 bytes (C++: <code>alignas(64)</code>), or have each thread accumulate locally and combine at the end. Finding it usually takes a profiler that reports cache misses.</p>`],
        ['Why might a sorted array with binary search beat a hash map for looking up a few hundred instruments?',
          `<p>Both are fast in theory: O(log n) against O(1). For a few hundred entries, the whole sorted array fits in a few cache lines' worth of L1 or L2, binary search touches about 8 entries, and branch-free versions avoid mispredictions. A hash map has to compute a hash, then jump to a bucket that is likely in a different cache line (and, for chained maps, follow a pointer to a node). At small sizes, constant factors and cache behaviour decide, so <b>measure</b>; at millions of entries the hash map wins.</p>`],
        ['What does branch prediction mean for code on a latency-critical path?',
          `<p>The CPU guesses the outcome of each branch and runs ahead on that guess. When the guess is right the branch costs almost nothing; when it's wrong, about 15–20 cycles of work are discarded. Branches that follow a pattern (a loop that runs 1,000 times, an error check that's almost never true) are predicted well. Branches on random data (is this price above the threshold?) mispredict about half the time.</p>
          <p><b>So:</b> keep the common path straight-line and predictable, move rare cases out of hot loops, and for data-dependent decisions consider branch-free code (arithmetic or conditional moves instead of if/else). Always confirm with a profiler: compilers already do some of this.</p>`],
        ['Why don\'t we just make CPUs faster instead of adding cores?',
          `<p>Power and heat. A chip's power use rises steeply with clock speed (higher frequency also needs higher voltage, and power grows with the square of voltage). Around 2005 clock speeds hit about 3–4 GHz and stalled because chips couldn't be cooled. Transistor counts kept growing, so they were spent on more cores, bigger caches and wider SIMD units instead. The consequence for software: a single thread no longer gets faster for free, so performance comes from using caches well, vectorising, and parallelising the work that can be split.</p>`],
      ],
      // Free LeetCode problems, each checked against LeetCode's own data on 19 Nov 2026.
      leetcode: [[622, 'Design Circular Queue', 'design-circular-queue', 'Medium', 'A ring buffer in a fixed array: the cache-friendly queue between pipeline stages'], [706, 'Design HashMap', 'design-hashmap', 'Easy', 'Build the buckets yourself and think about how they sit in memory'], [191, 'Number of 1 Bits', 'number-of-1-bits', 'Easy', 'How integers are represented in bits'], [190, 'Reverse Bits', 'reverse-bits', 'Easy', 'Bit manipulation on fixed-width integers']],
      checks: [
        { id: 'arch-1', q: 'An array of 1,000,000 int64 values is read once, in order. How many 64-byte cache lines does that touch, in thousands?', a: 125, tol: { abs: 0.5 }, sol: '1,000,000 × 8 bytes = 8,000,000 bytes, and 8,000,000/64 = <b>125</b> thousand lines. Each line brings 8 values, so 7 of every 8 reads are cache hits even before prefetching helps.' },
        { id: 'arch-2', q: 'Roughly how many times slower is a main-memory access (~100 ns) than an L1 cache hit (~1 ns)?', a: 100, tol: { abs: 10 }, sol: 'About <b>100×</b>. That ratio is why data layout often matters more than the number of instructions.' },
        { id: 'arch-3', q: 'Which change most often speeds up a hot loop over a million orders?', opts: [['Storing the orders contiguously in an array instead of as separately allocated objects'], ['Replacing multiplication with addition where possible', 'Modern CPUs multiply in a few cycles; that\'s rarely the bottleneck.'], ['Using shorter variable names', 'Names don\'t exist at run time in compiled code.'], ['Adding more threads, one per order', 'Thread overhead would dwarf the per-order work.']], sol: 'Contiguous storage turns scattered memory accesses (a cache miss per object) into sequential reads that the prefetcher handles. That\'s often worth 5–10×.' },
      ],
    },
    {
      id: 'memory', title: 'Memory management',
      blurb: 'Stack and heap, allocation costs, virtual memory and page faults, garbage collection pauses.',
      reality: `<p>Every program sees <b>virtual memory</b>: addresses that the CPU translates to physical RAM in 4 KB <b>pages</b>, using page tables cached in the <b>TLB</b>. The first touch of a fresh page causes a <b>page fault</b> while the OS finds a physical page (microseconds; milliseconds if it must read from disk).</p>
        <p>A program uses two kinds of memory. The <b>stack</b> holds each function call's local variables: allocating is just moving a pointer, and it's freed automatically on return. The <b>heap</b> holds data that outlives a call or whose size isn't known in advance: an allocator (malloc, new) has to find a free block, which usually takes tens of nanoseconds but sometimes far longer, and memory must be freed explicitly (C), by ownership rules (C++ RAII, Rust), or by a garbage collector (Java, C#, Go) or reference counting (Python, Swift).</p>`,
      constraints: `<ul><li><b>Allocation has a variable cost.</b> Usually fast, occasionally slow (the allocator asks the OS for more memory, or a lock is contended), which shows up as latency spikes.</li>
        <li><b>Garbage collectors pause or slow the program</b> at moments you don't choose.</li>
        <li><b>Fragmentation:</b> long-running processes that allocate and free mixed sizes end up with memory that's free but in unusable pieces.</li>
        <li><b>Page faults and TLB misses</b> add microseconds to the first touch of memory and to random access over large areas.</li></ul>`,
      design: `<ul><li><b>Allocate up front, not on the hot path:</b> preallocate buffers, use object pools or arenas, and reuse objects for each message instead of creating new ones.</li>
        <li><b>Touch memory at start-up</b> (and lock it with mlock) so page faults happen before trading starts; use huge pages (2 MB) to cut TLB misses.</li>
        <li><b>In garbage-collected languages,</b> avoid producing garbage in steady state (reuse objects, primitive arrays), tune or choose a low-pause collector, and keep the most latency-critical parts in C++ or carefully written code.</li>
        <li><b>Use ownership to prevent leaks and double frees:</b> in C++, RAII and smart pointers (unique_ptr for single ownership; shared_ptr only when ownership really is shared, since its reference count is an atomic operation).</li></ul>`,
      questions: [
        ['What is the difference between the stack and the heap?',
          `<p><b>The stack</b> is a region per thread where each function call gets a frame for its local variables. Allocation is moving one pointer, it's freed automatically when the function returns, and it's almost always in cache. It's small (often 1–8 MB), and its contents can't outlive the call.</p>
          <p><b>The heap</b> is shared memory managed by an allocator, for data that must outlive a call, is large, or has a size known only at run time. Allocation means finding a free block (tens of nanoseconds usually, sometimes much more), and something must free it: you, an ownership rule, or a garbage collector.</p>
          <p><b>In practice:</b> prefer the stack (or memory you allocated once up front) on hot paths; heap allocation per message is a classic source of latency spikes.</p>`],
        ['Why would a low-latency trading system avoid allocating memory while handling a market data message?',
          `<p>Because allocation time is unpredictable. Most calls to malloc or new are quick, but some take far longer: when the allocator needs more memory from the OS (a system call and page faults), when its internal lock is contended by another thread, or (in Java) because every allocation brings the next garbage collection closer. The average is fine; the worst case lands on exactly the message you needed to react to.</p>
          <p><b>The fix</b> is to do the allocation before trading starts: preallocated ring buffers for messages, object pools for orders, fixed-size arrays for book levels. The hot path then only reads and writes memory it already owns.</p>`],
        ['What is a page fault, and how can one hurt latency?',
          `<p>Programs use virtual addresses; the OS maps them to physical memory page by page (4 KB). When the program touches a page that isn't mapped yet, the CPU traps into the kernel, which finds a physical page, zeroes it, and updates the page table: a <b>minor fault</b>, around a microsecond. If the data has to come from disk (memory that was swapped out, or a memory-mapped file), it's a <b>major fault</b>, milliseconds.</p>
          <p><b>Latency impact:</b> the first message that touches a new buffer pays the fault. Systems avoid it by pre-touching all memory at start-up, locking it in RAM (mlock) so it can't be swapped out, and disabling swap on trading machines.</p>`],
        ['How does Python manage memory, and why does that matter for performance?',
          `<p>CPython uses <b>reference counting</b>: every object stores how many references point to it, and it's freed the moment the count reaches zero. A separate cycle collector finds groups of objects that refer only to each other. Every assignment updates reference counts, and everything, even an integer, is a heap-allocated object with a header (a Python float takes 24 bytes for an 8-byte number).</p>
          <p><b>So:</b> loops over many small objects are slow and memory-hungry, which is why numerical work uses NumPy arrays (one block of raw numbers). Reference counting is also a reason for the GIL: without it, every count update would need to be atomic.</p>`],
        ['What is a memory leak in a garbage-collected language?',
          `<p>Memory that's still reachable but will never be used again, so the collector can't free it. Classic causes: a cache or map that only grows (every order id ever seen, kept forever), listeners or callbacks registered and never removed, and long-lived objects holding references to short-lived ones. In a trading system that runs all day, a slow leak shows up as rising memory and longer GC pauses in the afternoon. Fixes: bound caches (LRU, time-to-live), remove entries when an order completes, and monitor heap size over the day.</p>`],
      ],
      // Free LeetCode problems, each checked against LeetCode's own data on 19 Nov 2026.
      leetcode: [[146, 'LRU Cache', 'lru-cache', 'Medium', 'Bounded memory with eviction: a hash map plus a doubly linked list'], [707, 'Design Linked List', 'design-linked-list', 'Medium', 'Nodes and pointers: what a linked structure costs'], [1146, 'Snapshot Array', 'snapshot-array', 'Medium', 'Store only the changes, not a full copy per snapshot'], [460, 'LFU Cache', 'lfu-cache', 'Hard', 'A harder eviction policy, all operations O(1)']],
      checks: [
        { id: 'mem-1', q: 'A 64 GB memory area is mapped with 4 KB pages. How many million pages is that? (1 GB = 2³⁰ bytes, 1 KB = 2¹⁰.)', a: 16.777216, tol: { abs: 0.01 }, sol: '64 × 2³⁰ / (4 × 2¹⁰) = 2³⁶/2¹² = 2²⁴ = 16,777,216 pages, about <b>16.8</b> million. With 2 MB huge pages it would be 32,768, which is why huge pages cut TLB misses for large data.' },
        { id: 'mem-2', q: 'Which allocation is cheapest?', opts: [['A local fixed-size array inside a function (the stack)'], ['new / malloc of the same size (the heap)', 'Heap allocation must find a free block and later free it.'], ['A Python list of the same length', 'Every element is a separate heap object, plus the list itself.'], ['All three cost the same', 'Stack allocation is a single pointer adjustment; the others are not.']], sol: 'A stack allocation is one adjustment of the stack pointer, freed automatically on return.' },
        { id: 'mem-3', q: 'Why do latency-sensitive systems pre-touch and lock their memory at start-up?', opts: [['So page faults and swapping can\'t happen during trading'], ['To make the program use less memory', 'Pre-touching uses the memory immediately; it doesn\'t reduce it.'], ['Because the OS refuses to allocate memory later', 'It allocates on demand; the problem is the delay when it does.'], ['To make garbage collection faster', 'It\'s about the OS\'s page tables, not the language runtime.']], sol: 'The first touch of each page costs a fault, and swapped-out pages cost disk reads. Doing it all at start-up moves that cost out of trading hours.' },
      ],
    },
    {
      id: 'concurrency', title: 'Concurrency',
      blurb: 'Threads, locks, atomics, races and deadlocks, the GIL, and why lock-free queues exist.',
      reality: `<p>A modern server has dozens of cores, each running one thread at a time. When threads share data, three physical facts matter. Making a change visible to other cores means moving cache lines between cores (tens of nanoseconds). Without synchronisation, compilers and CPUs <b>reorder</b> memory operations, so another thread can see writes in a different order from the one you wrote them in. And a thread that blocks (waiting for a lock or for I/O) is taken off its core by the OS, a <b>context switch</b> of a few microseconds plus cold caches when it resumes.</p>`,
      constraints: `<ul><li><b>Shared mutable state needs synchronisation</b> (locks or atomics), or you get races: lost updates, torn reads, impossible states.</li>
        <li><b>Contention serialises:</b> a lock held by one thread makes the others wait, so a heavily contended lock can make more threads slower than one.</li>
        <li><b>Amdahl's law:</b> if a fraction s of the work is serial, the speed-up on any number of cores is at most 1/s.</li>
        <li><b>Blocking costs microseconds,</b> which on a hot path is often more than the work itself.</li></ul>`,
      design: `<ul><li><b>Share less:</b> give each thread its own data (partition by symbol or by client), and pass messages instead of sharing structures.</li>
        <li><b>Single-writer principle:</b> one thread owns each piece of state; others send it requests. No locks needed for the state itself.</li>
        <li><b>Lock-free queues between stages:</b> a single-producer single-consumer ring buffer lets the network thread hand messages to the strategy thread with a couple of atomic operations and no system calls.</li>
        <li><b>Busy-spin instead of blocking</b> on dedicated cores when microseconds matter (it burns a core, but never sleeps).</li>
        <li><b>In Python,</b> threads help with I/O but not CPU-bound work (the GIL); use processes or native libraries (NumPy releases the GIL) for CPU work.</li></ul>`,
      questions: [
        ['What is a race condition? Give an example and the fix.',
          `<p><b>The idea.</b> A race condition is a bug whose outcome depends on the timing of threads. The classic case is a read-modify-write that isn't atomic.</p>
          <p><b>Example.</b> Two threads each run <code>position += qty</code>. Each reads the old value (say 100), adds its quantity, and writes back. If both read 100 before either writes, one update is lost: the position ends at 100 + one quantity instead of both. It may work in testing and fail under load.</p>
          <p><b>Fix:</b> make the read-modify-write atomic: a lock around it, an atomic integer (fetch_add), or design it away by giving the position a single owning thread that applies all updates in order.</p>`],
        ['What is a deadlock, and how do you prevent one?',
          `<p>Two or more threads each wait for a lock another one holds, so none can proceed. Thread 1 holds the account lock and wants the order-book lock; thread 2 holds the order-book lock and wants the account lock.</p>
          <p>A deadlock needs four conditions at once: mutual exclusion, holding one resource while waiting for another, no pre-emption (locks can't be taken away), and a circular wait. Break any one. The practical rules: <b>always take locks in one global order</b> (which removes circular waits), hold locks for as short a time as possible, never call unknown code (callbacks) while holding a lock, and use try-lock with a timeout where a fallback exists. Or avoid multiple locks altogether with single-owner designs.</p>`],
        ['Mutex, atomic, or lock-free queue: how do you choose?',
          `<p><b>A mutex</b> protects a block of code that touches several pieces of state together. Uncontended it costs about 20 ns, but under contention threads may sleep and wake (microseconds). Default choice for correctness when contention is low.</p>
          <p><b>An atomic variable</b> handles a single value (a counter, a flag, a sequence number) with one hardware instruction: no sleeping, but cache-line traffic between cores if many threads hit it.</p>
          <p><b>A lock-free queue</b> (often a single-producer single-consumer ring buffer) passes data between threads, each owning its end. It's the standard way to connect pipeline stages in low-latency systems: predictable, no system calls, no blocking. More complex to write correctly, so use a well-tested one.</p>
          <p>The underlying preference: <b>avoid sharing</b> where you can, then use the lightest tool that is correct.</p>`],
        ['What does Python\'s GIL mean for a multi-threaded program?',
          `<p>The Global Interpreter Lock lets only one thread execute Python bytecode at a time in a CPython process. So <b>CPU-bound</b> Python code doesn't speed up with threads (it may slow down slightly). <b>I/O-bound</b> code does benefit: a thread waiting on the network or disk releases the GIL, so others run.</p>
          <p><b>Options for CPU work:</b> multiprocessing (separate interpreters, each with its own GIL, at the cost of copying data between them), or native code that releases the GIL (NumPy, many C extensions). Note that the GIL doesn't make your own code thread-safe: <code>x += 1</code> is several bytecodes, and a thread switch can happen between them. (Python 3.13 and later also offer an optional build without the GIL.)</p>`],
        ['Explain Amdahl\'s law with an example.',
          `<p>If a fraction s of a job must run serially and the rest parallelises perfectly over n cores, the speed-up is 1 / (s + (1 − s)/n). The serial part sets a ceiling of 1/s however many cores you add.</p>
          <p><b>Example.</b> A risk calculation is 10% serial (loading data, aggregating results). On 8 cores the speed-up is 1/(0.1 + 0.9/8) ≈ 4.7×, not 8×; on 1,000 cores it's still under 10×. So before adding cores, shrink the serial part, and check whether shared resources (a lock, memory bandwidth) are quietly making more of the job serial.</p>`],
      ],
      // Free LeetCode problems, each checked against LeetCode's own data on 19 Nov 2026.
      leetcode: [[1114, 'Print in Order', 'print-in-order', 'Easy', 'Make threads wait for each other: events and locks'], [1115, 'Print FooBar Alternately', 'print-foobar-alternately', 'Medium', 'Two threads taking turns'], [1116, 'Print Zero Even Odd', 'print-zero-even-odd', 'Medium', 'Coordinating three threads with semaphores'], [1117, 'Building H2O', 'building-h2o', 'Medium', 'Barriers: release threads in groups'], [1195, 'Fizz Buzz Multithreaded', 'fizz-buzz-multithreaded', 'Medium', 'Four threads sharing one counter'], [1226, 'The Dining Philosophers', 'the-dining-philosophers', 'Medium', 'The classic deadlock, and how lock ordering avoids it']],
      checks: [
        { id: 'conc-1', q: 'A job is 10% serial and 90% perfectly parallel. What is the speed-up on 8 cores? (2 decimal places.)', a: 4.71, tol: { abs: 0.01 }, sol: '1/(0.1 + 0.9/8) = 1/0.2125 = <b>4.71</b>. The serial 10% caps the speed-up at 10× on any number of cores.' },
        { id: 'conc-2', q: 'Two threads each increment a shared counter 1,000 times with an unprotected read-modify-write. Which final values are possible?', opts: [['Anything from 2 up to 2,000'], ['Exactly 2,000, always', 'Lost updates make lower values possible.'], ['Either 1,000 or 2,000', 'Updates can be lost one at a time, so any number in between can happen too.'], ['Only values between 1,000 and 2,000', 'With unlucky interleavings it can fall below 1,000; the minimum is 2.']], sol: 'Each lost update removes one increment. Values near 2,000 are typical, but in the worst interleaving one thread can repeatedly overwrite the other\'s progress, and the minimum possible result is 2. The fix is an atomic increment or a lock.' },
        { id: 'conc-3', q: 'Which design removes the need for locks on an order book?', opts: [['One thread owns the book and receives all updates through a queue'], ['Each thread takes a copy of the book before changing it', 'The copies diverge, and merging them back needs locks anyway.'], ['Using a hash map instead of a tree', 'The structure doesn\'t change whether shared access needs synchronising.'], ['Adding more threads so contention is spread out', 'More threads on shared state means more contention, not less.']], sol: 'With a single writer there is no concurrent modification to protect: other threads communicate by message. It\'s the usual design in low-latency systems.' },
      ],
    },
    {
      id: 'networking', title: 'Networking',
      blurb: 'TCP and UDP, multicast market data, latency v bandwidth, the speed of light, and kernel bypass.',
      reality: `<p>Data travels at about two-thirds of the speed of light in optical fibre, <b>5 µs per kilometre</b>, so distance sets a hard floor on latency. Each hop through a switch adds hundreds of nanoseconds; putting a packet on the wire takes time proportional to its size (1.2 µs for 1,500 bytes at 10 Gb/s); and the operating system's network stack adds microseconds on each side.</p>
        <p><b>TCP</b> gives a reliable, ordered byte stream: a handshake before data (one round trip), acknowledgements, retransmission of lost packets, and congestion control. <b>UDP</b> sends independent datagrams with no delivery guarantee, no ordering and no handshake. <b>Multicast</b> UDP lets an exchange send one packet that the network copies to every subscriber.</p>`,
      constraints: `<ul><li><b>Distance is latency:</b> no software trick beats the speed of light between two cities.</li>
        <li><b>Reliability costs latency:</b> a lost TCP packet stalls everything behind it until it's retransmitted (head-of-line blocking).</li>
        <li><b>Latency and bandwidth are different:</b> a fatter pipe doesn't make one small message arrive sooner.</li>
        <li><b>The kernel is in the way:</b> each send and receive through normal sockets costs system calls and copies.</li></ul>`,
      design: `<ul><li><b>Market data by UDP multicast</b> (one feed to thousands of subscribers, no per-client state), with sequence numbers to detect gaps, two redundant copies (A and B lines), and a separate recovery channel for retransmissions.</li>
        <li><b>Orders by TCP</b> (FIX or a binary protocol): every order must arrive exactly once and in order, and the session gives a natural place for acknowledgements.</li>
        <li><b>Colocation:</b> servers in the exchange's data centre, cutting the distance to tens of metres. Between cities, microwave and laser links beat fibre because radio travels at nearly the full speed of light in air, in straighter lines.</li>
        <li><b>Kernel bypass</b> (the network card writes directly into user-space memory) and FPGAs for the very fastest paths; TCP_NODELAY to turn off Nagle's algorithm, which would otherwise delay small messages.</li>
        <li><b>Compact binary messages</b> (fixed layouts, not JSON) so they're small on the wire and cheap to decode.</li></ul>`,
      questions: [
        ['TCP or UDP for market data, and for orders? Why?',
          `<p><b>Market data: UDP multicast.</b> One exchange feeds thousands of clients, so per-client TCP connections would cost the exchange state and acknowledgements for each, and a slow client could hold others up. Multicast sends each packet once. And for prices, a retransmitted old update is often worthless by the time it arrives: you'd rather have the next one. Lost packets are detected with sequence numbers, covered by a second identical feed (A/B arbitration), and recovered from a retransmission service or snapshot if both lines miss them.</p>
          <p><b>Orders: TCP.</b> Each order must arrive exactly once, in order, and be acknowledged. TCP gives reliability and ordering, and the session is a natural unit for logging in and sequence checks. The latency cost is acceptable because the connection is set up before trading, and TCP_NODELAY stops small messages being delayed.</p>`],
        ['What happens, roughly, between your process sending a message and the other process receiving it?',
          `<ol><li>Your code writes into a socket: a system call copies the data into the kernel.</li>
          <li>The kernel's TCP/IP stack adds headers (and keeps a copy for retransmission), and the network card sends the frame: serialisation time depends on size and link speed.</li>
          <li>The packet crosses switches (hundreds of ns each) and cable (5 µs per km of fibre).</li>
          <li>The receiving card raises an interrupt or is polled, the kernel processes the headers and queues the data, and the receiving process wakes up (possibly a context switch) and copies it out with another system call.</li></ol>
          <p>Inside one data centre that's typically 10–50 µs round trip with standard sockets. <b>Kernel bypass</b> removes the system calls, copies and interrupts (the application polls the card directly), bringing it to a few microseconds.</p>`],
        ['What is the difference between latency and bandwidth, and which matters more for trading?',
          `<p><b>Bandwidth</b> is how much data per second a link carries; <b>latency</b> is how long one piece of data takes to arrive. A truck full of hard disks has huge bandwidth and terrible latency.</p>
          <p>Trading messages are small (an order is tens of bytes), so the time to send one is dominated by latency: distance, hops and software. Extra bandwidth doesn't make an order arrive sooner. Bandwidth matters for market data during bursts (the open, news), when the feed can briefly exceed the link and packets queue or drop, so links are sized for peaks, not averages.</p>`],
        ['What is Nagle\'s algorithm, and why do trading systems disable it?',
          `<p>Nagle's algorithm makes TCP hold back a small message while earlier data is still unacknowledged, so it can combine small writes into fewer, fuller packets. That saves bandwidth for chatty applications. Combined with delayed acknowledgements on the receiver, it can hold a small message back for tens of milliseconds. For a trading system each order is small and urgent, so sockets set <b>TCP_NODELAY</b> to send immediately.</p>`],
        ['Why do firms pay for microwave links between Chicago and New York when fibre already exists?',
          `<p>Light in glass travels at about two-thirds of its speed in air, and fibre routes follow roads and railways rather than straight lines. Microwave towers send signals through air at almost the full speed of light, along a nearly straight path. On the roughly 1,200 km route that saves about 2–3 milliseconds each way, which is decisive when the same price change reaches several firms and the first to react gets the trade. The trade-offs: much less bandwidth, and weather (heavy rain) can interrupt the link, so fibre stays as the backup.</p>`],
      ],
      // Free LeetCode problems, each checked against LeetCode's own data on 19 Nov 2026.
      leetcode: [[468, 'Validate IP Address', 'validate-ip-address', 'Medium', 'IPv4 and IPv6 address formats, carefully'], [93, 'Restore IP Addresses', 'restore-ip-addresses', 'Medium', 'IPv4 rules again, with backtracking'], [535, 'Encode and Decode TinyURL', 'encode-and-decode-tinyurl', 'Medium', 'A small service design: keys, collisions, storage'], [981, 'Time Based Key-Value Store', 'time-based-key-value-store', 'Medium', 'The latest value at or before a timestamp: like matching a trade to its quote']],
      checks: [
        { id: 'net-1', q: 'Light in fibre travels about 200,000 km per second. How many microseconds does a one-way trip over 100 km of fibre take?', a: 500, tol: { abs: 1 }, sol: '100 km ÷ 200,000 km/s = 0.0005 s = <b>500 µs</b>: 5 µs per km. A round trip is 1 ms before any software runs.' },
        { id: 'net-2', q: 'How many microseconds does it take just to put a 1,500-byte packet onto a 10 Gb/s link?', a: 1.2, tol: { abs: 0.01 }, sol: '1,500 × 8 = 12,000 bits ÷ 10¹⁰ bits/s = 1.2 × 10⁻⁶ s = <b>1.2 µs</b>. A 64-byte order message takes about 0.05 µs, which is one reason small messages matter.' },
        { id: 'net-3', q: 'Why do exchanges publish market data over UDP multicast?', opts: [['One packet reaches every subscriber, with no per-client connection state'], ['UDP guarantees delivery faster than TCP', 'UDP guarantees nothing; that\'s why feeds carry sequence numbers.'], ['TCP can\'t carry binary data', 'TCP carries any bytes.'], ['Multicast encrypts the data', 'It doesn\'t; encryption is a separate layer.']], sol: 'Multicast is one-to-many: the network copies each packet to every subscriber, so the exchange sends once and treats everyone equally. Reliability is handled by sequence numbers, A/B feeds and recovery channels.' },
      ],
    },
    {
      id: 'python', title: 'Your language: Python from the inside',
      blurb: 'How lists, dicts, sets, deques and heaps are stored, what each operation costs in time and memory, and why.',
      reality: `<p>Optiver's own advice is to know your language's standard collections well: the time complexity of their key operations, their space cost, and how they're represented in memory. In CPython (64-bit, 3.12):</p>
        <ul><li><b>Everything is an object on the heap</b>, with a header holding a reference count and a type pointer (16 bytes). A float takes 24 bytes for 8 bytes of data; a small int takes 28.</li>
        <li><b>Containers hold pointers</b> (8 bytes each), not the values themselves. A list of a million floats is 8 MB of pointers plus 24 MB of float objects, about 32 MB; a NumPy array of the same numbers is 8 MB.</li>
        <li><b>list</b> is a dynamic array of pointers that over-allocates (by about 12.5%) so appends rarely need to copy. <b>dict</b> and <b>set</b> are hash tables (a dict keeps insertion order, using a compact array of entries plus a sparse index table). <b>deque</b> is a doubly linked list of 64-slot blocks. <b>heapq</b> is a binary heap stored in an ordinary list. <b>str</b> and <b>tuple</b> are immutable.</li></ul>
        <table class="hb-table"><tr><th>Operation</th><th>Cost</th></tr>
          <tr><td>list: index, append, pop from the end</td><td>O(1) (append amortised)</td></tr>
          <tr><td>list: insert or pop at the front, <code>x in list</code>, remove(x)</td><td>O(n)</td></tr>
          <tr><td>dict / set: get, set, delete, <code>in</code></td><td>O(1) average, O(n) worst case</td></tr>
          <tr><td>deque: append and pop at either end</td><td>O(1)</td></tr>
          <tr><td>heapq: push, pop / peek at the smallest</td><td>O(log n) / O(1)</td></tr>
          <tr><td>heapq.heapify, building from a list</td><td>O(n)</td></tr>
          <tr><td>sorted, list.sort</td><td>O(n log n), and stable</td></tr>
          <tr><td>bisect: search / insort</td><td>O(log n) / O(n), because of the shift</td></tr></table>`,
      constraints: `<ul><li><b>Per-object overhead:</b> millions of small Python objects cost several times their raw data in memory and are slow to create.</li>
        <li><b>Interpreter overhead:</b> each bytecode step costs tens of nanoseconds, so a Python loop does roughly 10–50 million simple operations a second, against billions for compiled code.</li>
        <li><b>The GIL:</b> one thread runs Python bytecode at a time, so threads help with waiting on I/O but not with CPU-bound work.</li>
        <li><b>Hash tables trade memory for speed:</b> a dict of 1,000 small ints takes about 37 KB, against 8 KB for a list of 1,000 pointers.</li></ul>`,
      design: `<ul><li><b>Pick the structure for the operations you need:</b> deque for a FIFO queue (not list.pop(0)), a set or dict for membership (not <code>in</code> on a list), heapq for "smallest next", bisect on a sorted list for range queries.</li>
        <li><b>Move numeric work into NumPy or pandas,</b> which store raw numbers in one block and loop in C.</li>
        <li><b>Use generators</b> to stream large inputs in constant memory instead of building lists.</li>
        <li><b>Use <code>__slots__</code> or tuples</b> for millions of small records, to drop the per-instance dict.</li>
        <li><b>Know when Python is the wrong tool:</b> latency-critical paths at trading firms are usually C++; Python is for tooling, analysis, research and orchestration, where clarity and development speed matter more.</li></ul>`,
      questions: [
        ['How is a Python list stored in memory, and why is append O(1) amortised?',
          `<p>A list is a contiguous array of pointers to objects, plus a length and a capacity. When the array is full, CPython allocates a bigger one (about 12.5% more, plus a little) and copies the pointers across. Most appends just write into spare capacity: O(1). The occasional resize costs O(n), but because capacity grows geometrically, the total copying over n appends is O(n), so O(1) per append on average.</p>
          <p><b>Example:</b> appending to an empty list, the capacity goes 4, 8, 16, 24, 32, 40…; in a loop of appends only a handful of them trigger copies.</p>
          <p><b>Follow-ups:</b> inserting at the front is O(n) (every pointer shifts), so use a deque for queues; and the values themselves live elsewhere on the heap, so a list of a million floats is about 32 MB, not 8.</p>`],
        ['How does a Python dict work, and what is the worst case?',
          `<p>A dict is a hash table. To find a key it computes <code>hash(key)</code>, uses it to pick a slot, and compares keys there; if the slot is taken by a different key it probes other slots in a fixed pattern. With a good hash and a table kept less than about two-thirds full (it resizes beyond that), lookups touch one or two slots: O(1) on average.</p>
          <p><b>Worst case:</b> if many keys collide, a lookup scans all of them: O(n). Python randomises string hashes per process to stop attackers forcing that. Keys must be hashable (immutable in practice): a list can't be a key, because changing it would change its hash and lose the entry.</p>
          <p><b>Since 3.7 dicts keep insertion order:</b> entries are stored in a compact array in the order added, with a separate small index table pointing into it, which also saves memory.</p>`],
        ['You need a queue of incoming orders, processed oldest first. Which Python structure, and why not a list?',
          `<p><b>collections.deque:</b> append at the right, popleft at the left, both O(1). A list makes pop(0) O(n) because every remaining pointer shifts left; with a million queued orders that's a million moves per pop. A deque is a doubly linked list of fixed-size blocks, so both ends are cheap. For a queue shared between threads, use queue.Queue (which adds locking), or a deque with care.</p>`],
        ['Estimate the memory used by a list of 1,000,000 distinct floats in Python, and by the same data in NumPy.',
          `<p><b>Python list:</b> the list holds 1,000,000 pointers × 8 bytes = 8 MB, plus a small header. Each float is a separate object of 24 bytes (16 bytes of header, 8 of data): 24 MB. Total about <b>32 MB</b>. (Measured: 32.4 MB with sys.getsizeof.)</p>
          <p><b>NumPy array:</b> one block of raw float64s, 8 bytes each: <b>8 MB</b>, four times smaller, and contiguous, so it's also much faster to scan.</p>
          <p><b>The reasoning to show:</b> separate the container from what it contains, and count the per-object header. That's the "memory footprint" question interviewers like.</p>`],
        ['Why is building a string with += in a loop a known performance trap, and what do you write instead?',
          `<p>Strings are immutable, so <code>s += piece</code> in principle creates a new string and copies everything so far: over n pieces that's O(n²) copying. CPython sometimes avoids the copy when nothing else refers to the string, but you can't rely on it (and other Python implementations don't do it). Collect the pieces in a list and call <code>"".join(pieces)</code> once: O(total length). The same idea applies to lists: building with + in a loop copies; use append or extend.</p>`],
        ['When would you use a tuple instead of a list?',
          `<p>When the data is a fixed record that shouldn't change, like a (price, quantity) pair or a dict key. Tuples are immutable, so they're hashable (if their contents are) and can be dict keys and set members; they're slightly smaller and faster to create; and immutability documents intent and prevents accidental changes. For records with names, a namedtuple or a frozen dataclass reads better. Use a list when the collection grows, shrinks or is modified.</p>`],
      ],
      // Free LeetCode problems, each checked against LeetCode's own data on 19 Nov 2026.
      leetcode: [[380, 'Insert Delete GetRandom O(1)', 'insert-delete-getrandom-o1', 'Medium', 'Combine a dict and a list for O(1) everything'], [232, 'Implement Queue using Stacks', 'implement-queue-using-stacks', 'Easy', 'Amortised O(1), explained'], [155, 'Min Stack', 'min-stack', 'Medium', 'Extra state alongside a stack'], [703, 'Kth Largest Element in a Stream', 'kth-largest-element-in-a-stream', 'Easy', 'heapq as a bounded min-heap'], [641, 'Design Circular Deque', 'design-circular-deque', 'Medium', 'What collections.deque gives you, built by hand']],
      checks: [
        { id: 'py-1', q: 'About how many MB does a Python list of 1,000,000 distinct floats take, counting the float objects? (64-bit CPython.)', a: 32, tol: { abs: 1.5 }, sol: '8 MB of pointers plus 1,000,000 × 24-byte float objects = 24 MB: about <b>32 MB</b> (32.4 measured). A NumPy array of the same numbers is 8 MB.' },
        { id: 'py-2', q: 'Which is the right structure for a first-in, first-out queue of orders?', opts: [['collections.deque, using append and popleft'], ['A list, using append and pop(0)', 'pop(0) shifts every remaining element: O(n) per pop.'], ['A dict keyed by arrival time', 'Finding the oldest entry would need a scan or a sort.'], ['A set', 'Sets have no order.']], sol: 'deque gives O(1) appends and pops at both ends.' },
        { id: 'py-3', q: 'What does x in big_list cost, compared with x in big_set?', opts: [['O(n) for the list, O(1) on average for the set'], ['O(log n) for both', 'Neither uses binary search; a list isn\'t known to be sorted.'], ['O(1) for both', 'A list has no index by value, so it must scan.'], ['O(n) for both', 'A set hashes x and checks one slot on average.']], sol: 'A list must compare x with each element in turn; a set hashes x and goes straight to its slot.' },
      ],
    },
  ];

  const HOTPATH = [
    ['A packet arrives', 'The market data packet reaches the network card of a colocated server, metres from the exchange.', 'Networking: colocation; UDP multicast; kernel bypass delivers it to user space without a system call.'],
    ['Decode', 'A thread pinned to its own core, busy-polling the card, reads the fixed-layout binary message in place.', 'Architecture: a dedicated core keeps caches warm; no parsing of text; no copies.'],
    ['Update the book', 'The order book, held in preallocated arrays indexed by price, is updated.', 'Memory: no allocation on the hot path. Architecture: contiguous arrays, cache-friendly.'],
    ['Decide', 'The strategy reads the book (same thread, or handed over through a lock-free ring buffer) and decides to send an order.', 'Concurrency: single writer, or an SPSC queue between stages; no locks, no blocking.'],
    ['Risk check', 'Pre-trade limits (position, order size, rate) are checked against counters the thread owns.', 'Concurrency: no shared locks. Design: checks simple enough to run in nanoseconds, but never skipped.'],
    ['Send', 'The order is encoded into a preallocated buffer and sent on an already-open TCP session with Nagle disabled.', 'Networking: TCP for reliability; connection set up before trading; TCP_NODELAY.'],
    ['Everything else', 'Logging, persistence and monitoring happen on other threads and cores, fed by queues.', 'Slow work (disk, formatting strings) is kept off the hot path, but never dropped.'],
  ];

  const METHOD = [
    ['Name the physical fact', 'What is the hardware or network actually doing? ("A cache miss to DRAM costs about 100 ns.")'],
    ['Say the constraint it creates', '"So pointer-heavy structures are slow even when big-O is good."'],
    ['Connect it to a design choice', '"That\'s why order books often use arrays indexed by price level."'],
    ['Give the trade-off', '"The array wastes memory for sparse prices and needs care when the price moves outside its range."'],
  ];

  QT.fundamentals = { LATENCY, TOPICS, HOTPATH, METHOD, byId: Object.fromEntries(TOPICS.map((t) => [t.id, t])) };
})();
