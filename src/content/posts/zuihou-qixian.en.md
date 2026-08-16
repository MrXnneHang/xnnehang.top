---
title: The Deadline
published: 2024-07-10
shelf: "书籍"
subCategory: ["小说", "心理学"]
category: Reviews
tags:
   - Reading
   - The Deadline
   - Project Management
   - Software Engineering
description: "Reading notes on The Deadline: project management, design, and a sense of purpose."
series:
   - Reading
lang: en
translationKey: zuihou-qixian
---

> This was probably the first novel I borrowed from the library as a freshman. After switching to e-books, I never borrowed books again. I miss it a little.

## Let me start from the beginning of the notebook:

Not much to say: this notebook is for recording things related to reading, especially reflections afterward. I would also like to have neat reading notes like Xiaoyin’s. I tried many times before, but rarely finished them. Usually I would go off to do something else halfway through, leave them there, or use the notebook for something unrelated. Sigh.

Reading often—or at least sometimes—lets me calm down between playing games and learning things (work). It activates a different part of my mind too. Rather than learning something, playing games, then learning something again, which only makes me stubborn, reading is a good relaxant. During that time, I can think about nothing at all, or think about impractical things unrelated to life.

# _The Deadline_, Tom DeMarco

## #An Unexpected Encounter

Finding it was an accident, and perhaps fate. I had been looking for another book with the same title by a different author. Only after requesting it from the library did I realize this was a happy mistake.

At first, seeing that it was a project-management book and also a novel, I assumed it would be another industry person trying to show off their expertise while also trying to write something accessible—and failing to write a decent novel.

## #What Drew Me In

**But it caught my attention perfectly. There were three reasons.**

- The cute and alluring Ms. Julian, who is also a kidnapper: a charming contrast.

I admit that my initial affection for this novel was built on liking its female character.

- It is about software engineering and programmers collaborating on a project. **I am interested in that.**

I have to say that my thinking has become somewhat programmer-like now, and I need chances to step outside that way of thinking.

- **I made it through the first twenty minutes.**

At the beginning, perhaps because I had not read a novel in so long, I could not immerse myself. My mind and eyes would not connect, and I felt sleepy. But after twenty minutes, I got into the zone.

**Many novels may reveal their lovely side as long as you make yourself open them and read for twenty minutes.**

That is when reading becomes enjoyable.

## #Some Excerpts and Summaries

Here are some notes. Some are summaries; others are copied directly.

**How to handle the pressure that accumulates over time once a software project begins.**

- Pressure is always lurking in the air, and it can catch people off guard once it takes shape.

- **The day a project begins and the day it nears completion are actually equivalent**, yet we are relaxed at first and frantic later. At the beginning, our mindset is too indulgent.

- The best way to solve pressure is to extinguish it before it takes shape: prevent illness before it appears, prepare early, finish early. But **do not remain under pressure and tension all the time. Short-term pressure may seem to solve many things, but long-term pressure only kills thought.**

- Keep a cynical attitude. Learn from cats; learn from the Monro programmers who are like cats. **No matter how the outside world demands or pressures me, I first consider only completing the minimum.** Or keep your own judgment. Do not be like Webber, dizzy from the overwhelming requirements in the documents.

- **Finish only one goal at a time.** Do not try to debug two bugs at once.

- **Treasure the feeling of suddenly becoming light after a project ends**, and remember afterward to sort out what you gained and learned. A project ending does not mean you are finished.

   --- Let us hope we can stop Belloc from appearing in our lives. (The endless, chattering client.)

P.S.

- Julian is so cute when she says, “He must miss me.”

- Every night, Webber sits at his desk and writes down experience and notes. This is only one way the author teaches us, but Webber tells a reporter: **“I will never open this notebook again, but its 101 principles have been burned into my consciousness.”** That is really cool. I probably write my blog from the same feeling.

So I cannot help considering why I started writing this notebook. It certainly was not so I could reread it over and over. After all, once I have written something down, what should be remembered has already been remembered.

At the same time, I think reading and writing reflections in this way helps the continuity of my reading and thinking, and also helps me form a good reading habit.

> WTF. Ever since I started using an e-reader, I have not picked up a pen. I also wonder whether I have stopped using my brain at the same time.

## #Design: Code with Divine Assistance

_The Deadline_ really hits my interests: programming projects, time management, human resources, and a charming kidnapper.

Here I will talk about the programming-design ideas mentioned in the project.

Aristotle believes that **designing a project’s modules before writing the program is important, important enough to deserve most of the time.**

What ordinary people usually understand by design here is:

Function → structure → implementation. Working backward from the result toward the underlying details and breaking things down. Before writing a project, you should know clearly what each part will do, along with its function and implementation.

**But designing only the implementation of functions is not enough. It is not the endpoint.** The real design exists in the programmer’s mind: what code module needs to be implemented now, what its pseudocode should look like. The final programming is only like putting puzzle pieces in their proper places. This can almost eliminate debugging: implement and verify the function of one small code block at a time. But I often write whatever comes to mind. I get trapped by bugs caused by a particular implementation, and instead of trying a different implementation, I change many things just to debug until it runs normally. Those changes not only waste a great deal of time; they may also pull parts further away from the original design.

I think what Aristotle really wants to emphasize is **having another perspective while writing code. When we get stuck in a bug, we know to change approaches rather than stubbornly fight it. While implementing, it is as if there is a puzzle background guiding what this piece and the next one should be.**

The design he emphasizes is probably that perspective and that puzzle background. If writing code is like receiving divine assistance, that perspective is the god.

> I can say that my programming habits are very bad right now. I write whatever I think of. Maybe I should learn to write pseudocode in my mind, try to reason about the next step and the current one, then work out the whole picture.

No program can be written without this sort of design. Still, most people get used to designing while they code. It is a little like chess: some people see more of the whole board, others only the local position; some can predict ten or more moves at once, while others can see only one or two moves before stopping.

> I am typically limited and short-sighted. I once called my programming habits carefree, but when I encounter a larger project, **every added feature can pull on the whole system, requiring repeated changes to all the code** rather than changes only to the local function. That makes me feel **I need to change. Maybe I need standards, and I need to see further.**

Design is consciously predicting the course of a chess game. But you do not need to see every possibility before you dare make a move; there would never be enough time. You only need to **see one linear path that reaches the finish. How to optimize is something to consider after reaching it. Trying to optimize while writing a feature that has not even taken shape is a grave mistake. In the end, do you spend more time writing the feature or debugging and optimizing it?**

Consciously **predict a target code block that can reach the result**. If possible, predict two and keep one as a backup. When one route fails, switch to the other instead of immediately debugging. Many people impulsively start writing right away, but the mistakes this causes—and the time later spent repeatedly debugging and testing—far exceed the time spent predicting first. Besides, no one enjoys running a program again and again, repeatedly investigating the cause of an error. If it can be done in one go, why not?

And doing it in one go does not mean writing everything and then running it once successfully. That is impossible; there will always be deviations and bugs. It means **writing each predicted code block in one pass, running it, passing once, and achieving the expected function. Only after verifying that function do I move on to the next prediction-and-writing stage.**

## #What Stays with Me Most

- **When a project has just begun, the crisis exists and the goal is clear. Yet the sense of crisis is weak, almost pleasant, while the sense of purpose is entirely absent—almost aimless.**

- **A sense of purpose is a positive and excited state of mind.**

- **We often have goals but lack a sense of purpose because we recognize those goals only as “things we ought to do,” rather than “things we especially want to do and achieve.”**

## #An Aside

> The story of that UI from two days ago: at first, my roommate was assigned to write the UI and I was assigned to write the functionality. We had a week, with a defense on Friday. On Thursday afternoon, he gave me code that ran but that I found deeply unsatisfying—
>
> - He said he wanted to learn how to write UI properly. At first he boasted that he would make it look good. But what he eventually gave me had no beautification at all: he drew a few boxes, made a few controls, put functions into them, and that was it.
> - The other issue was speed. Several parts of the software requirements involved taking photographs and facial recognition—in short, opening the camera. When he clicked a button, it initialized the camera. When another part needed the camera, it stopped the first one, released it, and initialized another. And to initialize the camera, he used:
>
>    ```python
>    self.camera = cv2.VideoCapture(0)
>    ```
>
>    This function took more than three seconds every time. In other words, I clicked to open the camera and waited four seconds; I clicked to start recognition and waited another five. A control took four or five seconds to respond, and it was single-threaded, so during the response the window could not receive messages or perform any other operation.
>
>    I was practically coughing up blood. I told him, “You are going to leave it like this without optimizing anything?” He said a device has only one camera; initializing two at once would crash it, so he could only stop one and open the other. He even demonstrated the crash to me.
>
>    It was already Thursday afternoon. I told him to optimize or beautify it a little more. He said, “Optimize my ass. It works. If you want it optimized, do it yourself,” then went back and opened League of Legends.
>
>    I only felt that the gap between his beginning and end was enormous. He did not beautify it, and he did not optimize it.
>
>    In the end, I really did take it on myself. This is where the distinction between goals and a sense of purpose, tasks and things one ought to do, becomes relevant.
>
>    For him, there was a goal at first, and perhaps he was even overly excited. Later, though, it became only a task. He had no real sense of purpose and only completed the minimum.
>
>    I was the opposite. I am obsessed with UI beautification—or rather, I am obsessed with anime. If I write something, it must have a bit of anime in it. So I added a background image, a logo, and icons. When I write these things, they are usually extras; I may not know exactly what to make, but the positive and excited mindset that comes with having a goal stays with me.
>
>    For the speed optimization, I initialized the camera when the program started and used it globally afterward. In the end, startup still took four or five seconds, but every other control responded immediately.
>
>    I call that state of having a sense of purpose **writing my own thing**. When I try to write my own thing, it has nothing to do with other people’s requirements; it is simply what I want. Anime-style beautification is what I want, and that is the key that lets me enter that state. But doing this often makes me skip meals, which is bad for my health.
>
>    And before trying to write my own thing, I usually make something terrible first—the minimum—at the fastest speed, then optimize it on that foundation. That leaves enough time to think about what can be done later and enough time to tinker. My roommate spent four days delivering what I considered the bare minimum, then stubbornly said that it worked. That made me really angry.
