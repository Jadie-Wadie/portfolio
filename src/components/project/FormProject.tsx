import React from 'react';

import { firebase, db, storage } from 'database';
import { Project } from 'models/Project';

import { Card, Form, InputGroup, FormControl, Button } from 'react-bootstrap';

type FormProjectProps = {
	project: Project;
	id: string;
};
type FormProjectState = {
	project: Project;
	image?: string;

	file?: File;
};

type FormProjectUpdate = Partial<
	Record<keyof Project, string | string[] | firebase.firestore.FieldValue>
>;

export default class FormProject extends React.Component<
	FormProjectProps,
	FormProjectState
> {
	constructor(props: FormProjectProps) {
		super(props);

		this.state = {
			project: Object.assign({}, props.project)
		};
	}

	async componentDidMount() {
		if (this.props.project.image) this.updateImageURL();
	}

	async componentDidUpdate(props: FormProjectProps) {
		if (this.props.project.image !== props.project.image)
			if (this.props.project.image) this.updateImageURL();
	}

	render() {
		const { name, desc, demo, code, tags } = this.state.project;
		return (
			<Card>
				<Form onSubmit={e => e.preventDefault()}>
					{this.state.image && (
						<Card.Img variant='top' src={this.state.image} />
					)}

					<Card.Body>
						<Form.Group controlId='name'>
							<Form.Label>Title</Form.Label>
							<Form.Control
								value={name ?? ''}
								onChange={this.onChange}
								autoComplete='off'
							/>
						</Form.Group>

						<Form.Group controlId='desc'>
							<Form.Label>Description</Form.Label>
							<Form.Control
								as='textarea'
								value={desc ?? ''}
								onChange={this.onChange}
								autoComplete='off'
							/>
						</Form.Group>

						<Form.Group controlId='demo'>
							<Form.Label>Live demo</Form.Label>
							<Form.Control
								type='url'
								value={demo ?? ''}
								onChange={this.onChange}
								autoComplete='off'
							/>
						</Form.Group>

						<Form.Group controlId='code'>
							<Form.Label>Source code</Form.Label>
							<Form.Control
								type='url'
								value={code ?? ''}
								onChange={this.onChange}
								autoComplete='off'
							/>
						</Form.Group>

						<Form.Group controlId='image'>
							<Form.Label>Image</Form.Label>
							<InputGroup className='mb-3'>
								<Form.File custom>
									<Form.File.Input
										value=''
										onChange={this.onChange}
									/>
									<Form.File.Label>
										{this.state.file?.name ??
											this.state.project.image?.split(
												'/'
											)?.[1] ??
											'Choose file'}
									</Form.File.Label>
								</Form.File>
								{this.state.image !== undefined && (
									<InputGroup.Append>
										<Button
											variant='danger'
											onClick={() =>
												this.onClick('image')
											}>
											Delete
										</Button>
									</InputGroup.Append>
								)}
							</InputGroup>
						</Form.Group>
					</Card.Body>

					<Card.Footer>
						<Form.Label>Tags</Form.Label>
						{tags?.map((tag, i) => (
							<Form.Group key={`${this.edits}-${i.toString()}`}>
								<InputGroup>
									<FormControl
										id='tag'
										name={i.toString()}
										value={tag ?? ''}
										onChange={this.onChange}
										autoComplete='off'
									/>
									<InputGroup.Append>
										<Button
											variant='danger'
											onClick={() =>
												this.onClick('delete', i)
											}>
											Delete
										</Button>
									</InputGroup.Append>
								</InputGroup>
							</Form.Group>
						))}
						<Button
							variant='success'
							onClick={() => this.onClick('create')}
							block>
							New Tag
						</Button>
					</Card.Footer>
				</Form>
			</Card>
		);
	}

	edits: number = 0;
	onClick = (name: string, index?: number) => {
		switch (name) {
			case 'create':
				this.setState(
					state => ({
						project: {
							...state.project,
							tags: [...(state.project.tags ?? []), '']
						}
					}),
					this.updateProject
				);
				this.edits++;
				break;

			case 'delete':
				if (index !== undefined)
					this.setState(state => {
						state.project.tags!.splice(index, 1);
						return state;
					}, this.updateProject);
				this.edits++;
				break;

			case 'image':
				this.setState(
					state => ({
						project: {
							...state.project,
							image: ''
						},
						image: undefined,
						file: undefined
					}),
					this.updateProject
				);
		}
	};

	onChange = ({
		target: { id, name, value, files }
	}: React.ChangeEvent<HTMLInputElement>) => {
		if (['name', 'desc', 'demo', 'code'].includes(id))
			this.setState(
				state => ({
					project: { ...state.project, [id as keyof Project]: value }
				}),
				this.updateProject
			);

		if (id === 'tag')
			this.setState(state => {
				state.project.tags![parseInt(name)] = value;
				return state;
			}, this.updateProject);

		if (id === 'image' && files?.[0] !== undefined) {
			this.setState(
				state => ({
					project: {
						...state.project,
						image: `images/${files[0].name}`
					},
					file: files[0]
				}),
				this.updateProject
			);
		}
	};

	updateImageURL = async () => {
		this.setState({
			image: await storage
				.ref(this.state.project.image)
				.getDownloadURL()
				.catch(({ message }) => console.error(message))
		});
	};

	updateProject = this.debounce(async () => {
		const data = Object.entries(this.state.project).reduce(
			(data: FormProjectUpdate, tuple) => ({
				...data,
				[tuple[0]]:
					tuple[1] && tuple[1]?.length !== 0
						? tuple[1]
						: firebase.firestore.FieldValue.delete()
			}),
			{}
		);

		if (this.state.file !== undefined)
			await storage
				.ref(`images/${this.state.file.name}`)
				.put(this.state.file);

		db.collection('projects')
			.doc(this.props.id)
			.set(data, { merge: true })
			.catch(({ message }) => console.error(message));
	}, 1000);

	debounce<T extends Function>(func: T, delay: number) {
		let timer: number;
		let call = (...args: any) => {
			clearTimeout(timer);
			timer = window.setTimeout(() => func(...args), delay);
		};
		return (call as unknown) as T;
	}
}
