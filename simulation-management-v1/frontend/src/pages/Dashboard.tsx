import { useState, ChangeEvent, useEffect } from 'react';
import { Button, Card, Col, Container, DropdownItem, DropdownMenu, DropdownToggle, Input, InputGroup, InputGroupText, Row, UncontrolledDropdown } from 'reactstrap';
import DataTable, { TableColumn } from 'react-data-table-component';
import { Check, X, ChevronDown, Edit, MoreVertical, Play, Trash2, Search } from 'react-feather';
import axios from 'axios';
import { Modal } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useLocation, useNavigate } from 'react-router-dom';
import Loading from '../components/Loading';
import { jwtDecode } from 'jwt-decode'
import { login } from '../redux/action/action';

interface DecodedToken {
    user_id: string;
}
interface Simulation {
    tempID?: number
    simulation_id: string,
    simulation_name: string;
    date: string;
    isRunning: boolean;
    parameters: string;
    path: string,
    result: string
}

const Dashboard = () => {
    const paginationRowsPerPageOptions = [15, 30, 50, 100];
    const [simulations, setSimulations] = useState<Simulation[]>([]);
    const [originalSimulations, setOriginalSimulations] = useState<Simulation[]>([]);
    const [show1, setShow1] = useState({ "modal": false })
    const [params, setParams] = useState({
        simulation_name: "",
        num_jobs: "",
        num_tors: "32",
        num_cores: "1",
        ring_size: "2",
        routing: "ecmp",
        path: ""
    })
    const [show, setShow] = useState({ "modal": false, "progress": "" });
    const [showprogress, setShowprogress] = useState(false);
    const [status, setStatus] = useState(false);
    const [error, setError] = useState("")
    const [simulationID, setSimulationsId] = useState("")
    const [tempID, setTempID] = useState(0);

    const handleClose = () => {
        setShow({ "modal": false, "progress": "" })
        setParams({
            simulation_name: "",
            num_jobs: "",
            num_tors: "32",
            num_cores: "1",
            ring_size: "2",
            routing: "ecmp",
            path: ""
        })
    };
    //close simulation
    const handleClose1 = () => {
        setShow1({ "modal": false })
        setParams({
            simulation_name: "",
            num_jobs: "",
            num_tors: "32",
            num_cores: "1",
            ring_size: "2",
            routing: "ecmp",
            path: ""
        })
    };
    const handleShow = () => setShow({ "modal": true, "progress": "" });
    const storage = localStorage.getItem("token")
    const decodedToken: DecodedToken = jwtDecode(String(storage))
    const uid: string = decodedToken.user_id

    const handleAddviewopen = async (data: string) => {
        const response = await axios.post("http://localhost:8000/api/show_result", { "data": data, "user_id": uid })

        setShow({ "modal": false, "progress": response.data })
        setShowprogress(true)
    }
    const handleAddviewclose = () => setShowprogress(false)
    const handlesimulation = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
        setParams({ ...params, [event.target.name]: event.target.value })
    }

    const user_info = useSelector((data: RootState) => data.user_id)
    const navigate = useNavigate()
    const { state } = useLocation()

    const fetchSimulations = async (): Promise<void> => {
        console.log(user_info);

        try {
            if (user_info) {
                const response = await axios.post('http://localhost:8000/api/get_simulate_flood_dns', { state });

                console.log(response);
                const myarray = response.data[0].parameters.split(',')


                setSimulations(response.data);
                setOriginalSimulations(response.data);
            }
        } catch (error) {
            console.error('Error fetching simulations:', error);
        }
    };

    const reRunsimulation = async (data: string, _simulation_id: string) => {

        setSimulations(prev => prev.map(sim => (sim.simulation_id == _simulation_id) ? { ...sim, isRunning: false } : { ...sim }))
        await axios.post("http://localhost:8000/api/re_run_simulation", { "data": data })
            .then(res => {
                setSimulations(prev => prev.map(sim => (sim.simulation_id == _simulation_id) ? { ...sim, isRunning: true } : { ...sim }))
                setShow({ "modal": false, "progress": res.data })

            })
            .catch(err => console.log(err.response.data));
    }

    const deleteSimulation = async (data: string) => {
        try {
            const response = await axios.post("http://localhost:8000/api/delte_simulation", { "data": data, "user_id": uid })

            setSimulations([...response.data])
        } catch (error) {
            console.error("Error deleting simulation", error);
        }
    }

    const createSimulation = async (data: string) => {
        if (data == "create") {
            setStatus(true)
        }
        try {
            setTempID(prev => ++prev)

            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            const _simulation = {
                tempID: tempID,
                simulation_id: "",
                simulation_name: params.simulation_name,
                date: formattedDate,
                isRunning: false,
                parameters: `${params.num_jobs},${params.num_cores},${params.ring_size},${params.routing}`,
                path: "",
                result: ""
            }

            setSimulations(prev => [...prev, _simulation])
            const response = await axios.post('http://localhost:8000/api/simulate_flood_dns', { "params": { ...params, tempID }, "user_id": uid })
            console.log(response.data);
            setSimulations([...response.data.data])
            setParams({
                simulation_name: "",
                num_jobs: "",
                num_tors: "32",
                num_cores: "1",
                ring_size: "2",
                routing: "ecmp",
                path: ""
            })
        } catch (error) {
            console.error('Error creating simulation:', error);
        }
    };

    const handlePathSimulation = async (data: Simulation) => {
        console.log(data);

        setSimulationsId(data.simulation_id)
        setStatus(true)
        setShow1({ "modal": true })
        const updatedata = data.parameters.split(',')
        const newdata = {
            params: data.parameters,
            simulation_name: data.simulation_name,
            num_tors: parseInt(updatedata[0]), // Assuming the first part is num_tors
            num_cores: parseInt(updatedata[1]), // Assuming the second part is num_cores
            ring_size: parseInt(updatedata[2]), // Assuming the second part is num_cores
            path: data.path
        }
        console.log(updatedata);
        const changedata = (data: { params: string, simulation_name: string, ring_size: number, num_cores: number, path: string }) => {

            setParams({
                ...params,
                simulation_name: data.simulation_name,
                num_jobs: updatedata[0],
                num_tors: "32",
                num_cores: updatedata[1],
                ring_size: updatedata[2],
                routing: updatedata[3],
                path: ""
            })
        }
        changedata(newdata)
    }



    const filterText = (event: ChangeEvent<HTMLInputElement>): void => {
        const searchText = event.target.value.toLowerCase()
        if (searchText === "") {
            setSimulations(originalSimulations); // Restore original data when filter text is empty
        } else {
            const filteredSimulations = originalSimulations.filter(simulation =>
                simulation.simulation_name.toLowerCase().includes(searchText) || simulation.parameters.toLowerCase().includes(searchText)
            );
            setSimulations(filteredSimulations);
        }
    }

    const editSimulation = async (): Promise<void> => {
        setSimulations(prev => prev.map(sim => (sim.simulation_id == simulationID) ? { ...sim, "simulation_name": params['simulation_name'], "parameters": `${params.num_jobs},${params.num_cores},${params.ring_size},${params.routing}`, "isRunning": false } : { ...sim }))
        setShow({ "modal": false, "progress": "" })
        console.log(simulationID);

        const response = await axios.post("http://localhost:8000/api/simulation_update", { "params": params, "simulationID": simulationID, "user_id": uid })
        setSimulations(response.data);
        setStatus(true)
    }

    const columns: TableColumn<Simulation>[] = [
        {
            name: 'Simulator Name',
            selector: (row) => row.simulation_name,
            sortable: true
        },
        {
            name: 'Date',
            selector: (row) => row.date,
            sortable: true
        },
        {
            name: 'Parameters',
            selector: (row) => row.parameters,
            sortable: true
        },
        {
            name: 'Is Running?',
            selector: (row) => row.isRunning,
            sortable: true,
            cell: (row) => {
                return row.isRunning ? <X size={20} color="red" /> : <Check size={20} color="green" />;
            }
        },
        {
            name: 'Actions',
            width: '120px',
            cell: (row) => {
                return (
                    <>
                        <UncontrolledDropdown>
                            <DropdownToggle tag="div" className="btn btn-sm">
                                <MoreVertical size={14} className="cursor-pointer action-btn" />
                            </DropdownToggle>
                            <DropdownMenu end container="body" >
                                <DropdownItem className="w-100" onClick={() => reRunsimulation(row.path, row.simulation_id)}>
                                    <Play size={14} className="mr-50" />
                                    <span className="align-middle mx-2" >Re-Run</span>
                                </DropdownItem>
                                <DropdownItem className="w-100" onClick={() => handlePathSimulation(row)}>
                                    <Edit size={14} className="mr-50" />
                                    <span className="align-middle mx-2">Edit</span>
                                </DropdownItem>
                                <DropdownItem className="w-100" onClick={() => handleAddviewopen(row.simulation_id)}>
                                    <Edit size={14} className="mr-50" />
                                    <span className="align-middle mx-2">View Progress</span>
                                </DropdownItem>
                                <DropdownItem className="w-100" onClick={() => deleteSimulation(row.simulation_id)}>
                                    <Trash2 size={14} className="mr-50" />
                                    <span className="align-middle mx-2" >Delete</span>
                                </DropdownItem>
                            </DropdownMenu>
                        </UncontrolledDropdown>
                    </>
                );
            }
        }
    ];

    useEffect(() => {
        fetchSimulations()
    }, [user_info])

    return (
        <div className="main-view">
            <Container>
                <Row className="my-3 justify-content-between align-items-center">
                    <Col md={8} lg={9} xl={10}>
                        <h4 className="main-title">Simulation</h4>
                    </Col>
                    <Col md={4} lg={3} xl={2} className="text-md-right">
                        <Button className='primary' onClick={handleShow}>New Simulation</Button>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col>
                        <InputGroup>
                            <Input placeholder="Search simulations..." name="filtertext" onChange={filterText} />
                            <InputGroupText>
                                <Search />
                            </InputGroupText>
                        </InputGroup>
                    </Col>
                </Row>
                <Card>
                    <DataTable
                        data={simulations}
                        responsive
                        className="react-dataTable"
                        pagination
                        paginationRowsPerPageOptions={paginationRowsPerPageOptions}
                        columns={columns}
                        sortIcon={<ChevronDown />}
                    />
                </Card>
            </Container>
            <Modal show={show.modal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Creating New Simulation</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <label>Simulation Name:</label>
                    <input className='form-control' name='simulation_name' onChange={handlesimulation} value={(params) ? params.simulation_name : ""} required />
                    <label>Num_Jobs</label>
                    <input className='form-control' type='number' onChange={handlesimulation} max={8} name='num_jobs' value={(params) ? params.num_jobs : ""} required />
                    {error ? (<p className='text-danger'>{error}</p>) : (<></>)}
                    <label>Num_Cors</label>
                    <select className='form-control' onChange={handlesimulation} name='num_cores' value={(params) ? params.num_cores : 1} required>
                        <option>0</option>
                        <option>1</option>
                        <option>4</option>
                        <option>8</option>
                    </select>
                    <label>Num_Rings</label>
                    <select className='form-control' onChange={handlesimulation} name='ring_size' value={(params) ? params.ring_size : 1} required>
                        <option>2</option>
                        <option>4</option>
                        <option>8</option>
                    </select>
                    <label>Algorithm</label>
                    <select className='form-control' onChange={handlesimulation} name='routing' value={(params) ? params.routing : "ecmp"} required>
                        <option>ecmp</option>
                        <option>edge_coloring</option>
                        <option>ilp_solver</option>
                        <option>mcvlc</option>
                        <option>simulated_annealing</option>
                    </select>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" name='create' onClick={() => createSimulation("create")}>
                        Create Simulation
                    </Button>

                </Modal.Footer>
            </Modal>
            <Modal show={show1.modal} onHide={handleClose1}>
                <Modal.Header closeButton>
                    <Modal.Title>Editing Simulation</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <label>Simulation Name:</label>
                    <input className='form-control' name='simulation_name' onChange={handlesimulation} value={(params) ? params.simulation_name : ""} required />
                    <label>Num_Jobs</label>
                    <input className='form-control' type='number' onChange={handlesimulation} max={8} name='num_jobs' value={(params) ? params.num_jobs : ""} required />
                    <label>Num_Cors</label>
                    <select className='form-control' onChange={handlesimulation} name='num_cores' value={(params) ? params.num_cores : 1} required>
                        <option>0</option>
                        <option>1</option>
                        <option>4</option>
                        <option>8</option>
                    </select>2
                    <label>Num_Rings</label>
                    <select className='form-control' onChange={handlesimulation} name='ring_size' value={(params) ? params.ring_size : 1} required>
                        <option>2</option>
                        <option>4</option>
                        <option>8</option>
                    </select>
                    <label>Algorithm</label>
                    <select className='form-control' onChange={handlesimulation} name='routing' value={(params) ? params.routing : "ecmp"} required>
                        <option>ecmp</option>
                        <option>edge_coloring</option>
                        <option>ilp_solver</option>
                        <option>mcvlc</option>
                        <option>simulated_annealing</option>
                    </select>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose1}>
                        Close
                    </Button>
                    <Button variant="primary" name='edit' onClick={editSimulation}>
                        Edit Simulation
                    </Button>

                </Modal.Footer>
            </Modal>

            <Modal show={showprogress} onHide={handleAddviewclose}>
                <Modal.Header closeButton>
                    <Modal.Title>Progress</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{show.progress}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleAddviewclose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div >


    );
};

export default Dashboard;
