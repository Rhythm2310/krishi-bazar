<script lang="ts">
  import { calculateTermGpa } from '$lib/domain/grading';
  import type { CourseEntry } from '$lib/domain/contracts';
  import { EFFECTIVE_DATE, DISCLAIMER } from '$lib/domain/data';

  const course: CourseEntry = {
    id: '1',
    code: 'CSE 1101',
    title: 'Tracer Course',
    credits: 3,
    grade: 'A',
    isRetake: false
  };

  const result = calculateTermGpa([course]);
</script>

<h1>UIU Calculator</h1>
<p>Tracer TermGpa: {result.termGpa.toFixed(2)}</p>

<footer>
  <p>Effective from: {EFFECTIVE_DATE}</p>
  <p>{DISCLAIMER}</p>
</footer>
