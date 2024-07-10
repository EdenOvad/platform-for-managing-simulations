import React, { useEffect, useState, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Container, Row, Col, Card, ListGroup, Modal } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { jwtDecode } from 'jwt-decode';


interface ExperimentDetailsProps {
    simulation_name: string;
    date: string;
    params: string;
    result: string;
    path: string;
    user_id: string;
    start_time: string;
    end_time: string;
}

interface DecodedToken {
    user_id: string;
}

const ExperimentDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [experiment, setExperiment] = useState<ExperimentDetailsProps | null>(null);
    const [outputFiles, setOutputFiles] = useState<string[]>([]);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [params, setParams] = useState({
        simulation_name: "",
        num_jobs: "",
        num_tors: "32",
        num_cores: "1",
        ring_size: "2",
        routing: "ecmp",
        path: "",
        seed: "0"
    });
    const [show, setShow] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const navigate = useNavigate();
    const user_info = useSelector((data: RootState) => data.user_id);
    const storage = localStorage.getItem("token");

    const decodedToken: DecodedToken = jwtDecode(String(storage));
    const uid: string = decodedToken.user_id;

    useEffect(() => {
        const fetchExperimentDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/api/get_experiment/${id}`);
                setExperiment(response.data);
                if (response.data.path) {
                    const encodedPath = encodeURIComponent(response.data.path);
                    const filesResponse = await axios.get(`http://localhost:8000/api/get_files/${encodedPath}`);
                    setOutputFiles(filesResponse.data.files);
                }
            } catch (error) {
                console.error('Error fetching experiment details:', error);
            }
        };

        fetchExperimentDetails();
    }, [id]);

    
    const handleFileClick = async (filePath: string) => {
        try {
            const encodedFilePath = encodeURIComponent(filePath);
            const response = await axios.get(`http://localhost:8000/api/get_file_content/${encodedFilePath}`);
            setFileContent(response.data.content);
            setShowContent(true);
        } catch (error) {
            console.error('Error fetching file content:', error);
        }
    };

    const handleRerun = async () => {
        if (!experiment) return;
        try {
            const response = await axios.post("http://localhost:8000/api/re_run_simulation", { data: experiment.path, simulation_id: id, user_id: uid });
            setExperiment({
                ...experiment,
                result: response.data.result,
                start_time: response.data.start_time,
                end_time: response.data.end_time
            });
        } catch (error) {
            console.error('Error re-running experiment:', error);
        }
    };

    const handleEdit = () => {
        if (experiment) {
            const updatedata = experiment.params.split(',');
            setParams({
                simulation_name: experiment.simulation_name,
                num_jobs: updatedata[0],
                num_tors: "32",
                num_cores: updatedata[1],
                ring_size: updatedata[2],
                routing: updatedata[3],
                path: experiment.path,
                seed: updatedata[4]
            });
            setShow(true);
        }
    };

    const handleSaveEdit = async () => {
        if (!experiment) return;

        // Close the modal immediately
        handleClose();

        // Optimistically update the state with new params
        const updatedParams = `${params.num_jobs},${params.num_cores},${params.ring_size},${params.routing},${params.seed}`;
        const updatedExperiment = {
            ...experiment,
            simulation_name: params.simulation_name,
            params: updatedParams
        };

        setExperiment(updatedExperiment);

        try {
            const response = await axios.post("http://localhost:8000/api/simulation_update", { params, simulationID: id, user_id: uid });

            // Ensure the state is properly updated with the response data, providing defaults for potentially undefined values
            setExperiment(prev => ({
                simulation_name: response.data.simulation_name || prev?.simulation_name || "",
                params: response.data.params || prev?.params || "",
                start_time: response.data.start_time || prev?.start_time || "",
                end_time: response.data.end_time || prev?.end_time || "",
                date: response.data.date || prev?.date || "",
                result: response.data.result || prev?.result || "",
                path: response.data.path || prev?.path || "",
                user_id: response.data.user_id || prev?.user_id || ""
            }));
        } catch (error) {
            console.error('Error updating experiment:', error);
        }
    };


    const handleDelete = async () => {
        if (!experiment) return;
        try {
            await axios.post("http://localhost:8000/api/delte_simulation", { data: id, user_id: uid });
            navigate('/simulation', { state: uid }); // Navigate back to the main page after deletion
        } catch (error) {
            console.error('Error deleting experiment:', error);
        }
    };

    const handleClose = () => {
        setShow(false);
        setParams({
            simulation_name: "",
            num_jobs: "",
            num_tors: "32",
            num_cores: "1",
            ring_size: "2",
            routing: "ecmp",
            path: "",
            seed: "0"
        });
    };

    const handleCloseContent = () => setShowContent(false);

    const handlesimulation = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
        setParams({ ...params, [event.target.name]: event.target.value });
    };

    if (!experiment) return <div>Loading...</div>;

    const paramsArray = experiment.params ? experiment.params.split(',') : [];
    const displayParams = {
        num_jobs: paramsArray[0] || "",
        num_cores: paramsArray[1] || "",
        ring_size: paramsArray[2] || "",
        routing: paramsArray[3] || ""
    };

    return (
        <Container>
            <Row className="my-3">
                <Col>
                    <Button variant="primary" onClick={() => navigate('/simulation')}>
                        Home
                    </Button>
                    <h2>{experiment.simulation_name}</h2>
                    <p>Date: {experiment.date}</p>
                    <Card>
                        <Card.Body>
                            <h5>Summary</h5>
                            <p>Start time: {experiment.start_time}</p>
                            <p>End time: {experiment.end_time}</p>
                        </Card.Body>
                    </Card>
                    <Card className="my-3">
                        <Card.Body>
                            <h5>Parameters</h5>
                            <ul>
                                {Object.entries(displayParams).map(([key, value]) => (
                                    <li key={key}>
                                        {key}: {value}
                                    </li>
                                ))}
                            </ul>
                        </Card.Body>
                    </Card>
                    <div className="my-3">
                        <Button variant="primary" className="mr-2" onClick={handleRerun}>
                            Re-run
                        </Button>
                        <Button variant="secondary" className="mr-2" onClick={handleEdit}>
                            Edit
                        </Button>
                        <Button variant="danger" onClick={handleDelete}>
                            Delete
                        </Button>
                    </div>
                    <Card className="my-3">
                        <Card.Body>
                            <h5>Output Files</h5>
                            <ListGroup>
                                {outputFiles.map((file, index) => (
                                    <ListGroup.Item key={index}>
                                        <Button variant="link" onClick={() => handleFileClick(file)}>
                                            {file}
                                        </Button>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Editing Simulation</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <label>Simulation Name:</label>
                    <input className='form-control' name='simulation_name' onChange={handlesimulation} value={params.simulation_name} required />
                    <label>Num_Jobs</label>
                    <input className='form-control' type='number' onChange={handlesimulation} max={8} name='num_jobs' value={params.num_jobs} required />
                    <label>Num_Cores</label>
                    <select className='form-control' onChange={handlesimulation} name='num_cores' value={params.num_cores} required>
                        <option>0</option>
                        <option>1</option>
                        <option>4</option>
                        <option>8</option>
                    </select>
                    <label>Num_Rings</label>
                    <select className='form-control' onChange={handlesimulation} name='ring_size' value={params.ring_size} required>
                        <option>2</option>
                        <option>4</option>
                        <option>8</option>
                    </select>
                    <label>Algorithm</label>
                    <select className='form-control' onChange={handlesimulation} name='routing' value={params.routing} required>
                        <option>ecmp</option>
                        <option>edge_coloring</option>
                        <option>ilp_solver</option>
                        <option>mcvlc</option>
                        <option>simulated_annealing</option>
                    </select>
                    <label>Seed</label>
                    <select className='form-control' onChange={handlesimulation} name='seed' value={params.seed} required>
                        <option value="0">0</option>
                        <option value="42">42</option>
                        <option value="200">200</option>
                        <option value="404">404</option>
                        <option value="1234">1234</option>
                    </select>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleSaveEdit}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showContent} onHide={() => setShowContent(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>File Content</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <pre>{fileContent}</pre>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowContent(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default ExperimentDetails;
