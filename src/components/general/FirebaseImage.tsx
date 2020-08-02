import React, {
	useState,
	useEffect,
	isValidElement,
	cloneElement
} from 'react';
import { storage } from 'database';

type FirebaseImageProps = { image: string; prop?: string };

const FirebaseImage: React.FunctionComponent<FirebaseImageProps> = ({
	image,
	prop,
	children
}) => {
	const [url, setURL] = useState<string | null>(null);

	async function getURL(image: string) {
		return new Promise<string>(
			async (resolve, reject) =>
				await storage
					.ref(image)
					.getDownloadURL()
					.then(resolve)
					.catch(reject)
		);
	}

	useEffect(() => {
		let mounted = true;

		if (image)
			getURL(image)
				.then(url => mounted && setURL(url))
				.catch(({ message }) => console.error(message));
		else setURL(null);

		return () => {
			mounted = false;
		};
	}, [image]);

	return (
		<>
			{url
				? React.Children.map(children, child =>
						isValidElement(child)
							? cloneElement(child, {
									[prop ?? 'src']: url
							  })
							: child
				  )
				: null}
		</>
	);
};

export default FirebaseImage;