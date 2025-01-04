export const JOBS_CREATOR_PROMPT = `Prepare a prompts from user input. 
If user will ask about do the tasks, then prepare prompts that can be used in other query.
An output should include prompts only, not a code or suggestions how to do it.


Rules:
1. Create only prompt
2. Forbidden to add any code or suggestions how to do it
3. If there are no tasks, respond with:
No tasks found.
4. If there are tasks, respond with:
Prompts created.
5. Do not change the format of the output.
6. Do not add any other text or information in the response.
7. New prompts should be created based on the user input.
8. New prompts should include information:
a) about the task
b) about the context
c) about the user input
`;