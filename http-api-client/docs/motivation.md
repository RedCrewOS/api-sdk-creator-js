## Motivation

<!--
  TODO: This section was adapted from the initial RFC. This documentation may be better used in 
  a central location that all libraries can refer to.
-->

When discussing distributed systems an "API" is commonly defined as a service that serves
machine readable representations of data (most notably JSON<sup>1</sup>) over the network and
that may also provide the ability to manipulate resources across the network.

Obstacles to consuming an API often include bad documentation, lack of knowledge, complexity,
and lack of time<sup>2</sup>.

API client applications (or libraries) often have to "reinvent the wheel" when consuming a new
API. For example, APIs are often protected so clients need to know how to authenticate and
subsequently provide proof of authorisation (eg: a bearer token).

API client SDKs (hereafter simply SDKs) help to solve a number of these problems as they can
reduce the effort and complexity required to integrate an application with an API as they can:

- Encapsulate how to access an API
- Manage common tasks, for example, obtaining and using an access token.
- Transform API data types into language specific data types, for example a JSON number into a
  Java BigDecimal

More and more developers are expecting a client SDK for an API offered by a company or product
as part of the overall API product.

Unfortunately writing an SDK manually can be repetitive and time-consuming. The quality of SDKs
can vary depending on the skills of the developers, and the complexity of the API.

A very typical approach to overcoming these issues with SDK development has been with code
generation from an API specification such as the [Open API Generator](https://openapi-generator.tech/).

Sadly most code generators fall into the same pitfalls.

1. Binding an application to a technology stack - most notably, but not limited to the HTTP
   client. For example, one Javascript API client SDK might use Axios and another Request.
   This can lead to build bloat or conflicts if abstractions leak into the global namespace.

2. Brittle code - generated code often don't have good abstractions which means that a minor
   change to a spec can lead to breaking changes for client applications.

3. "Static binding" - similar to (2), due to no abstraction/modularisation of behaviour
   everything for the SDK is generated in the target directory with coupling between components
   being made at generation time. If a client application wanted to override a piece of
   behaviour, or add behaviour, it is often unable to, or a developer has to make a source
   level change. Source level changes run the risk of being overwritten the next time the code
   is generated thus negatively impacting the client application.

4. Lack of testing - developers might make changes to generator templates without testing the
   change which increase the probability of bugs. Generated code generally doesn't have tests
   generated as well.

5. No upgrade path - if changes are required, the only options to client application developers
   is to regenerate the entire SDK which may introduce breaking changes, or additional defects.
   Client applications might pin the generator version to control the outcome which causes a
   massive barrier to overcome to upgrade a client application.

## Moving towards better SDKs

If developers were to abstract the functionality of an SDK to a set of steps it would be:

1. Take application specific data types and convert to API data structures
2. Create a HTTP request that knows how to use an API endpoint. This might include knowing what
   request headers to set, what authorisation scheme is required, or what content type to use
   to represent data.
3. Send the request.
4. Convert the HTTP response into application data structures.<sup>3</sup>

(Optional steps might include adding error handling such as automatic retrying on failures,
dealing with API throttling, updating an access token or anything else really.)

From this list of steps we can deduce that we have a few types that any SDK can be built from
(and that are exported from this library).

- `HttpRequest` and `HttpResponse`.
- A `HttpResult` which pairs a request with the response so that handlers have all the information.
  For example, an access token retry strategy has to first identify the authorisation error -
  typically a response with a status code of `401` - and then update the request with a new
  access token to be able to try again. So both the request and the response are needed.
- `HttpClient` - Abstraction around sending data to an endpoint. Importantly, this library
  doesn't provide an implementation of `HttpClient`. This allows SDK developers/consumers to
  use whichever HTTP client library they want to. As long as the library is wrapped in a
  `HttpClient` it can be composed into an `HttpApiClient` flow.

The programming paradigm that best allows us to encapsulate a set of steps that operate over
a small set of types is [Functional Programming](https://en.wikipedia.org/wiki/Functional_programming)
(FP) as each step (or sub-step, or subsub-step) can be implemented as function that takes and returns
one of our core SDK types, modifying the data in some way. We can then use function
composition<sup>4</sup> to create a pipeline of steps where a request can be threaded through
all the functions and become a response. Consequently, this library exports the `HttpApiClient`
type as a function type that takes a request and returns a response. The `HttpApiClient`
function type is the boundary between functions this library provides, and the specific parts
of an SDK such as the host details/path structure for a request, or how to transform API data
structures from/into an SDK/application domain model. However, as an abstraction it gives SDK
developers a lot of power in being able to create and compose many functions of the correct
function types together to form bigger SDK building blocks.

Thinking some more about creating a HTTP request, we can see that there are commonalities such
as the transformation of application data into a request (path params, query params), adding
headers, and reading/writing common content types (eg: JSON). With function composition at our
disposal we can have a `HttpRequestPolicy` function type that takes a request and returns a new
request. `addHeaders` and `jsonMarshaller` are both examples of this type.

Finally, a `HttpResultHandler` is a function that takes a result, and returns a new result
with a transformation applied. Combined with other functional programming techniques pipelines
of handlers can be used in different scenarios to return results or to implement HTTP error
handling.

By using composable, tested functions, SDK creators can create more sophisticated functions
that can then be used to allow applications to consume an API with a fraction of the amount of
code that is used in imperative/OOP SDKs (including error handling). There are some
introductory resources listed below on FP. It is not possible to explain every concept used as
that would simply be a rewrite of existing, excellent resources. However, a lot of FP material
(particularly those written in Haskell) [start with abstract concepts](https://byorgey.wordpress.com/2009/01/12/abstraction-intuition-and-the-monad-tutorial-fallacy/)
which can leave a lot of people left scratching their heads as to how to apply the concepts.
This library is more concerned about how concepts can be used to meet the goal of building SDKs
with hopefully just enough theory to help users (SDK developers) understand design decisions
made and how to use the building blocks in this library to quickly and confidently create SDKs.

With that in mind, any reader that has poked around this library may have noticed that the
function types mentioned like `HttpRequestPolicy` and others actually return an `Async` of
"type" where "type" is one of the core SDK types. This is because in real world programs, and
especially in an SDK we have to deal with errors, and asynchronous behaviour which means we
need some additional tools to compose our SDK pipe together.

### Using railway tracks to create SDKs

To understand why every function type returns an `Async` we have to think about how
errors are represented in imperative/OO SDKs (or any program), and the consequences of the
traditional approaches.

Traditionally any error is represented by an [Exception<sup>5</sup>](https://docs.oracle.com/javase/tutorial/essential/exceptions/definition.html) being thrown to change the
course of execution through the program. This approach is really the only option available to developers
without additional language level support or libraries, to provide alternative mechanisms for
specifying many alternate paths of execution.<sup>6</sup>

As a result of only having a hammer, exceptions quickly get grouped by developers into
[two buckets of nails](https://www.oreilly.com/library/view/97-things-every/9780596809515/ch21.html).
"Technical" exceptions are for problems like dereferencing a null variable or a network socket
timing out. "Business" exceptions are for issues like "customer not found", or
"order not submitted". In statically typed languages (eg: Java), this is often represented with
separate exception class hierarchies so that separate `catch` blocks can be used<sup>7</sup>. In
Javascript this approach to exception definition is more tricky as it relies on properties on
the object or the correct prototype chain for differentiating between the two types of
exceptions. "Business" exceptions are typically recoverable as they actually represent an
alternate, valid (in terms of the "business process") path of control rather than a genuine
exceptional circumstance.  While some "Technical" exceptions can be recovered from, for example
a network socket can be recreated; most are not as they represent a type error, a dereferencing
of unallocated memory, memory capacity being exceeded, etc. Thus "Technical" exceptions are
actually Exceptions, and "Business" exceptions are "failures" or a different type of result
being hammered into a runtime mechanism for altering the flow of execution.

Teasing the previous paragraph apart, we can see that the reason developers often go down the
path of creating different buckets of exceptions is because they instinctively realise that there
are [two distinct types](https://fsharpforfunandprofit.com/posts/against-railway-oriented-programming/#when-should-you-use-result)
of errors which are better described as:
- Domain errors - These are valid "failure" responses from an API, they're just non 200.
  Customers aren't found, orders aren't submitted, etc. They need to be handled by the
  application in order to meet requirements. What happens when a customer can't submit an
  order? The program should recover, provide default options, etc - not panic.

- Panics - These are unrecoverable. Dereferencing null, out of memory, etc.

(Infrastructure errors could be a domain error, or a panic depending on the circumstance.
For example, an order may not be submittable because a queue is not available. Even though
there is a technical reason, the error can be modelled as a domain error encapsulating the
technical problem so that callers can focus on the what, not the why.)

We need a better way of representing domain errors and leave Exceptions for panics.

Thinking about the circumstances in which a domain error can arise, we soon realise that the
way we model these circumstances in code should mimic the requirements. For example, analysing the
requirement *"If the customer exists then update their name else do nothing"* tells
us that the function `findCustomer` can return either a `Customer` or `Nothing`<sup>8</sup>. Our
code can then act on the result. When a `Customer` is returned then update their name, else on
`Nothing` do nothing.

The language construct that can be used to achieve this is the [Sum Type](https://en.wikipedia.org/wiki/Tagged_union)
which allows developers to specify the different types that a value can be, and enforce handling
of all those types through [pattern matching](https://softwareengineering.stackexchange.com/a/367535/384665).
Typescript achieves this with [Union types](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html),
Kotlin uses [Sealed Classes](https://kotlinlang.org/docs/reference/sealed-classes.html),
Swift uses [Enumerations](https://docs.swift.org/swift-book/LanguageGuide/Enumerations.html).
When acting on a value that is a Sum Type, languages that have Sum Types ensure<sup>9</sup> that
the user of that value considers all possible types to ensure nothing is missed. Contrast that
with how in the past most compilers would have happily let you get away with not checking for nothing ie: null.

For example

```typescript
// typescript
// assume our types have a "type" property for discrimating
const customer: Customer | Nothing = findCustomer();

switch(customer.type) {
  case "Customer": return updateName(name, customer);
  case "Nothing": return;
}
```

We can use Unions to build out a `Result` Sum Type that can either be something or an `Error`.

```typescript
// typescript
type Result<T> = T | Error
```

We can compose paths or tracks through the program by switching the flow of execution based on
the type of result returned from functions. We thus end up with a programming style called
[Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/). ROP is much more expressive
programming style as it allows developers to define small, singular minded functions<sup>10</sup>
and compose them together while ensuring (thanks to Sum Types) that the flow of execution is
correct.

When constructing an SDK a common requirement is to fetch an access token, and add it to the
request headers. Fetching an access token may fail and if it does we don't want to proceed with
making the API call. With Sum Types, if the function to fetch an access token fails, the execution
will switch tracks and continue without the developer having to write complex `if/else`
statements or `try/catch` blocks. The types take care of it for us.

### From railways to onions

One consequence of using Sum Types as defined by unions is that every user of a Sum Type has to
have the same set of exhaustive pattern matching statements to branch the flow of execution.
That's going to get annoying fast!

What we need to do is encapsulate the branching logic into a reusable chunk of code and then
apply that logic to a value. We already have a technique for doing that with polymorphic
dispatch<sup>11</sup>. So what we need is a "Container Sum Type" that wraps the plain type and knows how to
operate (or `map`) on the wrapped value with different "strategies".

Enter a type called [Maybe](https://jrsinclair.com/articles/2016/marvellously-mysterious-javascript-maybe-monad/)
(or `Optional` from Java 8).

`Maybe` is a Sum Type that has two subtypes. `Just<T>` or `Nothing`. It has a method on it called
`map` that will apply the passed function if there is a value (`Just`) or do nothing when there
is no value in the container (`Nothing`), which is the branching logic we want but encapsulated
in a [parametric polymorphic "strategy"](https://en.wikipedia.org/wiki/Parametric_polymorphism).

```typescript
// typescript
const customer: Maybe<Customer> = findCustomer();

/*
 * If customer is a Just<Customer> then the customer's name will be updated
 * If customer is Nothing then nothing will happen.
 */
customer.map(updateCustomer(name));
```

(An observant reader may have noticed that in the first `findCustomer` example, `updateName`
was called with both it's arguments, but in the second it was only called with the first
argument. Both code snippets are correct because `updateName` is a fictional curried binary
function. In a curried function all the arguments can be given at once, or partially applied.
Here we're seeing the beauty in the use of currying so that we can map the `updateCustomer`
function over the `customer` with a new `name`)

`Maybe` is an example of a group of types called Algebraic Data Types (ADTs) which are
"Container types" that "implement" different interfaces (such as
[Functor, Applicatives and others](https://medium.com/@tzehsiang/javascript-functor-applicative-monads-in-pictures-b567c6415221#.rdwll124i)).
ADTs allow us to compose functions together while encapsulating the messiness of dealing with
nothingness, errors and asynchronous behaviour. Because Javascript doesn't natively have ADTs
this library relies on an ADT library called [Crocks](https://crocks.dev/).

Having encapsulated the abstraction of *"if there is a value do something else do nothing"* into
a parametric polymorphic Sum Type it can be used with any other type including functions which
return a Sum Type of their own. When you have Sum Types of Sum Types of Sum Types you have many
layers to peel through to get at the "plain" value, which brings us to Monads<sup>12</sup> as
not only can Monads `map`, they can `chain` to avoid the nesting problem.
For a more complete discussion of Monads see some of the references.

Therefore, the reason that the function types return an `Async` is that `Async` is Crock's
"lazy asynchronous monadic Sum Type"<sup>13</sup>, which therefore allows us to
compose/chain asynchronous functions together, allowing SDK developers to define different
tracks for handling errors, HTTP errors (failures), and all manner of outcomes.

We let `Async` take care of the plumbing so that we can just write the functions we need.

`Async` is much more preferred over Promises, as [Promises suffer a few flaws](https://avaq.medium.com/broken-promises-2ae92780f33)
that will get in our way, most notable that they are eager. Once defined they kick off on the
next tick.

## Examples

// TODO

## Functional Programming references

- [Functional Programming in JavaScript](https://www.manning.com/books/functional-programming-in-javascript) -
  even though the examples use Ramda.js, Crocks can be substituted easily.
- [Professor Frisby's Mostly Adequate Guide to Functional Programming](https://mostly-adequate.gitbooks.io/mostly-adequate-guide) - a very popular "open source" text on FP, with an
  [accompanying video tutorial](https://egghead.io/lessons/javascript-unboxing-things-with-foldable).
- [Things I wish someone had explained about functional programming](https://jrsinclair.com/articles/2019/what-i-wish-someone-had-explained-about-functional-programming/) - some
  good blog posts about how to understand terms used in FP, and how to apply the concepts.
- [Functional Programming for the Object-Oriented Programmer](https://leanpub.com/fp-oo) - a
  helpful book to transition from an OOP mindset to a FP mindset. Given the examples are in Clojure
  this book is best used by non Clojure developers when paired with other resources so that
  concepts (like "lifting") can be seen in Javascript and a more pure FP language like Lisp/Clojure.
- [Working with ADTs in Crocks](https://www.youtube.com/watch?v=fIb1IOVh6cY&list=PLjvgv-FpMo7XRVFZjZsWXJ5nVmRJ5a5Hv&index=1) -
  video series specifically for Crocks
- [Functional JS with Crocks](https://www.youtube.com/watch?v=O1Gu5b7rxbw&list=PLjvgv-FpMo7XvlfO8YKiz4_onf8WonhiA&index=1) -
  another video series on specific parts of Crocks

----

<sup>1</sup> As of Postman's 2020 [State of the API](https://www.postman.com/state-of-api/)
report - *"REST is the dominant architectural style, used by 93.4% of respondents."* where "REST"
is mistakenly defined as any architecture that exchanges JSON via HTTP.

<sup>2</sup> *"When asked about the biggest obstacle to consuming APIs, lack of documentation
clocked in the highest obstacle to consuming APIs (54.3%), by an extremely wide margin. Other
top obstacles to consuming APIs are lack of knowledge, complexity, and lack of time, all cited
by a little over one-third of respondents."* -
[State of the API - Executing On APIs](https://www.postman.com/state-of-api/executing-on-apis/#executing-on-apis)

<sup>3</sup> Most of the time this step often mixes transformation  of HTTP/API data types with
control flow. For example a "non success" HTTP response (typically anything in the 400/500
range) is converted into an `Error` and thrown. This is icky and there are better ways to
switch the execution path based on the response from the server.

<sup>4</sup> In OOP, type composition is achieved by encapsulating objects within objects. This
is the basis for the [Law of Demeter](https://en.wikipedia.org/wiki/Law_of_Demeter). When
composing objects of the same types, the [Decorator Pattern](https://en.wikipedia.org/wiki/Decorator_pattern)
allows objects that implement the same interface to wrap each other to compose behaviour.
Function composition is a more powerful technique. The OOP variants are really poor man cousins
to their functional brethren.

<sup>5</sup> In Javascript, any object can be thrown; however [best practise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)
dictates that only `Error`s should be thrown because they define a known structure (eg: have a
`message`) and have a stacktrace. We will therefore consider the `Error` type as the base for
all Exceptions in Javascript.

<sup>6</sup> Throwing exceptions in FP is really frowned upon because it's considered impure.
[Pure functions and referential transparency](https://mostly-adequate.gitbook.io/mostly-adequate-guide/ch03)
is what makes function composition possible. Exceptions really mess with that.

<sup>7</sup> Complete with the religious war over checked/unchecked exceptions. This argument
is a consequence of incorrectly using exceptions to model domain errors with the desire to
force callers to deal with all result types (checked) and using exceptions for exceptional
circumstances that aren't recoverable and should see the program fail fast (unchecked)

<sup>8</sup> By using an appropriate type to represent "absence of value", we can also move away
from using `null` which is the [billion dollar mistake](https://www.infoq.com/presentations/Null-References-The-Billion-Dollar-Mistake-Tony-Hoare/)

<sup>9</sup> Typescript is a little bit lazy and won't enforce exhaustive pattern matching
without a bit of help/configuration. Kotlin/Swift refuse to compile however.

<sup>10</sup> The [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single-responsibility_principle)
applies to functions as well.

<sup>11</sup> Again we have a popular OOP pattern of the encapsulation of logic behind a
polymorphic interface being the [Strategy Pattern](https://en.wikipedia.org/wiki/Strategy_pattern)

<sup>12</sup> It's a common joke in the FP world that Monads are like onions, and ogres and
parfait. They've got layers.

<sup>13</sup> Lazy evaluation is a really important tool as we can specify function pipes,
for example a `HttpResultHandler` that fetches a new access token across a network but only have
it executed/evaluated when required ie: when the API responds with a `401`
