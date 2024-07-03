'use client';
import axios from 'axios';
import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ClipLoader } from 'react-spinners';
import useLocalStorageState from 'use-local-storage-state';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
	'pdfjs-dist/build/pdf.worker.min.mjs',
	import.meta.url
).toString();

const API_KEY = '78684310-850d-427a-8432-4a6487f6dbc4';

const Convertor = () => {
	const [file, setFile] = useState<string | null>(null);
	const [text, setText] = useState<string>('');
	const [httpError, setHttpError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [pageNumber, setPageNumber] = useState<number>(1);
	const [numPages, setNumPages] = useState<number>();
	const [history, setHistory] = useLocalStorageState<{ name: string; fileData: string }[]>(
		'history',
		{
			defaultValue: []
		}
	);

	const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		setText(e.target.value);
	};

	const handleConvertText = async () => {
		if (!text) {
			return;
		}

		setIsLoading(true);
		setHttpError(null);
		try {
			const url = `http://95.217.134.12:4010/create-pdf?apiKey=${API_KEY}`;
			const response = await axios.post(
				url,
				{ text: text.trim() },
				{
					responseType: 'arraybuffer'
				}
			);

			const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
			const reader = new FileReader();
			reader.onloadend = () => {
				const base64data = reader.result as string;
				setFile(base64data);
				setText('');
				if (!history.some((file) => file.name === text.trim())) {
					setHistory([...history, { name: text, fileData: base64data }]);
				}
			};
			reader.readAsDataURL(pdfBlob);
		} catch (error: any) {
			setHttpError(error.message || JSON.stringify(error));
		} finally {
			setIsLoading(false);
		}
	};

	const handleGetFileFromHistory = (file: { name: string; fileData: string }) => {
		setFile(file.fileData);
		setText(file.name);
	};
	const onDocumentLoadSuccess = ({ numPages }: { numPages: number }): void => {
		setNumPages(numPages);
	};

	const sliceName = (name: string) => {
		return name.length > 10 ? `${name.slice(0, 10)}...` : name;
	};

	return (
		<div className="px-5 max-w-full flex gap-5 flex-col justify-center items-center">
			{httpError && <p className="text-red-600 font-bold p-5">{httpError}</p>}
			<div className="w-96">
				{history.length > 0 && (
					<div className="flex flex-col gap-2 py-2">
						<p>History:</p>
						<ul className="flex flex-wrap">
							{history.map((record, index) => (
								<li
									className="pl-2 text-orange-500 hover:underline cursor-pointer"
									onClick={() => {
										handleGetFileFromHistory(record);
									}}
									key={index}>
									{`${index + 1}.`} {sliceName(record.name)}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
			<div className="flex flex-col w-96">
				<div className="flex flex-col gap-3 items-center">
					<input
						className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-base focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
						type="text"
						onChange={handleInput}
						value={text}
					/>
					<button
						disabled={!text.trim()}
						onClick={handleConvertText}
						type="button"
						className="text-white bg-blue-700 disabled:cursor-not-allowed cursor-pointer disabled:bg-gray-600 disabled:hover:bg-gray-600 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
						Конвертувати в PDF
					</button>
				</div>
			</div>
			<div>
				{isLoading && (
					<ClipLoader color="tomato" size={30} aria-label="Loading Spinner" data-testid="loader" />
				)}
				{!isLoading && file && (
					<>
						<Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
							<Page pageNumber={pageNumber} />
						</Document>
					</>
				)}
			</div>
		</div>
	);
};

export default Convertor;
