const fs = require("fs");
const os = require("os");
const { exec } = require("child_process");

const { compose } = require("crocks");

const { assertThat, instanceOf, is, isRejectedWith, promiseThat } = require("hamjest");

const {
	compileNamedTemplates,
	renderComponentsObject,
	renderNamedTemplate
} = require("../../src/visitors/renderer");
const { newHbs } = require("../../src/templates/hbs");
const { registerPartial } = require("../../src/templates/wrappers");

describe("renderer visitor", function() {
	const outdir = `${os.tmpdir()}/api-sdk-creator-generator`;
	const renderer = renderComponentsObject(outdir, "typescript");

	console.log(outdir);

	describe("rendering component object", function() {
		it("should render schema objects", async function() {
			const componentsObject = {
				schemas: {
					identifier: {
						title: "Identifier",
						type: "string"
					},
					account: {
						title: "Account",
						type: "object",
						properties: {
							id: {
								type: "Identifier",
								required: true
							},
							names: {
								type: "array",
								items: {
									type: "Identifier"
								},
								required: true
							}
						},
						imports: [
							{
								type: "Identifier",
								location: "identifier"
							}
						]
					}
				}
			}

			await verifyResult(componentsObject);
		});

		async function verifyResult(componentsObject) {
			const result = await renderer(componentsObject).toPromise();
			assertThat(result, is(componentsObject));

			await verifyFilesWritten(componentsObject);
			await verifyTypescript();
		}

		async function verifyFilesWritten(componentsObject) {
			await Promise.all(Object.keys(componentsObject.schemas)
				.map(compose(fs.promises.stat, inTmpDir)));
		}

		async function verifyTypescript() {
			await fs.promises.writeFile(
				`${outdir}/tsconfig.json`,
				JSON.stringify(givenTSConfig()),
				{ encoding: "utf8" }
			);

			try {
				const result = await runTsc();

				const stdout = result.stdout;

				if (stdout && stdout.length > 0) {
					console.log(result.stdout);
				}

				assertThat(result.exitCode, is(0));
			}
			catch (e) {
				console.log(e.stderr);
				console.log(e.stdout);

				throw e.error;
			}
		}

		function runTsc() {
			return new Promise((resolve, reject) => {
				const process = exec(
					`npx tsc --noEmit -p ${outdir}`,
					(error, stdout, stderr) => {
						const result = {
							exitCode: process.exitCode,
							error,
							stdout,
							stderr
						};

						if (error) {
							return reject(result);
						}

						resolve(result);
					}
				)
			});
		}

		function inTmpDir(fle) {
			return `${outdir}/${fle}.d.ts`;
		}

		function givenTSConfig() {
			return {
				include: [
					"./*.ts"
				]
			};
		}
	});

	describe("rendering templates", function() {
		// hbs: Async Error Handlebars
		const hbs = newHbs("typescript")
			.map(registerPartial("test", "Hello World"));

		it("should render named templates", async function() {
			const layouts = {
				layout: "{{> test }}"
			}

			const templates = compileNamedTemplates(hbs, layouts);
			const result = await renderNamedTemplate(templates, "layout", {}).toPromise();

			assertThat(result, is("Hello World"));
		});

		it("should catch error when templates can't be rendered", async function() {
			const layouts = {
				layout: "{{> test"
			}

			const templates = compileNamedTemplates(hbs, layouts);

			await promiseThat(
				renderNamedTemplate(templates, "layout", {}).toPromise(),
				isRejectedWith(instanceOf(Error))
			)
		});
	});
});
