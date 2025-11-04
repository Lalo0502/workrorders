// Allow importing global CSS files in TypeScript contexts
declare module "*.css" {
	const content: Record<string, string> | string
	export default content
}
