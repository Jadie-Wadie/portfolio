import React from 'react';

import { NavLink } from 'react-router-dom';

import { Navbar, Nav, NavDropdown, Form, Button } from 'react-bootstrap';

declare namespace Header {
	export type Link = {
		type: 'link';
		name: string;
		url: string;
	};
	export type Group = {
		type: 'group';
		name: string;
		url: string;
		links: Link[];
	};

	export type Button = {
		name: string;
		call: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
	};

	export type Props = {
		title: string;
		entries: (Header.Link | Header.Group)[];
		buttons?: Header.Button[];
	};
	export type State = { active: boolean };
}

class Header extends React.Component<Header.Props, Header.State> {
	constructor(props: Header.Props) {
		super(props);

		this.state = {
			active: false
		};
	}

	render() {
		return (
			<Navbar collapseOnSelect expand='lg' bg='light' variant='light'>
				<Navbar.Brand children={this.props.title} />
				<Navbar.Toggle aria-controls='responsive-navbar-nav' />
				<Navbar.Collapse id='responsive-navbar-nav'>
					<Nav className='mr-auto'>
						{this.props.entries.map(
							(entry: Header.Link | Header.Group) =>
								entry.type === 'group' ? (
									<NavDropdown
										key={entry.name}
										title={entry.name}
										id={entry.name}>
										{entry.links.map(link => (
											<NavDropdown.Item
												key={link.name}
												to={entry.url + link.url}
												as={NavLink}
												children={link.name}
											/>
										))}
									</NavDropdown>
								) : (
									<Nav.Link
										key={entry.name}
										to={entry.url}
										as={NavLink}
										children={entry.name}
									/>
								)
						)}
					</Nav>
					{Array.isArray(this.props.buttons) && (
						<Form className='my-2 my-lg-0' inline>
							{this.props.buttons.map(button => (
								<Button
									key={button.name}
									variant='outline-primary'
									onClick={button.call}
									children={button.name}
								/>
							))}
						</Form>
					)}
				</Navbar.Collapse>
			</Navbar>
		);
	}
}

export default Header;