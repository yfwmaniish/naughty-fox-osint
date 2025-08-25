import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Maximize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Entity, Relationship } from '@/types';

interface MindMapProps {
  entities: Entity[];
  relationships: Relationship[];
  onNodeClick?: (entity: Entity) => void;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  type: string;
  value: string;
  confidence: number;
  mentions: number;
  group: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  type: string;
  confidence: number;
}

export default function MindMap({ entities, relationships, onNodeClick }: MindMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const getNodeColor = (type: string) => {
    const colors: Record<string, string> = {
      person: '#00ff41',
      email: '#00d4ff',
      phone: '#ff0040',
      location: '#a855f7',
      username: '#ffff00',
      organization: '#ff8c00',
      url: '#ff69b4',
      ip: '#32cd32'
    };
    return colors[type] || '#ffffff';
  };

  const getNodeSize = (mentions: number, confidence: number) => {
    return Math.max(8, Math.min(20, (mentions * confidence * 15)));
  };

  useEffect(() => {
    if (!svgRef.current || entities.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create nodes and links
    const nodes: Node[] = entities.map((entity, index) => ({
      id: entity.id,
      type: entity.type,
      value: entity.value,
      confidence: entity.confidence,
      mentions: entity.mentions,
      group: index % 8
    }));

    const links: Link[] = relationships.map(rel => ({
      source: rel.source,
      target: rel.target,
      type: rel.type,
      confidence: rel.confidence
    }));

    // Create simulation
    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create container group
    const container = svg.append('g');

    // Create links
    const link = container.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#333')
      .attr('stroke-width', (d: Link) => Math.sqrt(d.confidence * 5))
      .attr('stroke-opacity', 0.6);

    // Create link labels
    const linkLabels = container.append('g')
      .selectAll('text')
      .data(links)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text((d: Link) => d.type);

    // Create nodes
    const node = container.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', (d: Node) => getNodeSize(d.mentions, d.confidence))
      .attr('fill', (d: Node) => getNodeColor(d.type))
      .attr('stroke', '#000')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 0 6px currentColor)')
      .call(d3.drag<SVGCircleElement, Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Add click handler to nodes
    node.on('click', (event, d) => {
      setSelectedNode(d);
      const entity = entities.find(e => e.id === d.id);
      if (entity && onNodeClick) {
        onNodeClick(entity);
      }
    });

    // Create node labels
    const nodeLabels = container.append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .attr('pointer-events', 'none')
      .text((d: Node) => d.value.length > 15 ? d.value.substring(0, 15) + '...' : d.value);

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabels
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node
        .attr('cx', (d: Node) => d.x!)
        .attr('cy', (d: Node) => d.y!);

      nodeLabels
        .attr('x', (d: Node) => d.x!)
        .attr('y', (d: Node) => d.y!);
    });

    // Add zoom controls
    const zoomIn = () => {
      svg.transition().call(zoom.scaleBy, 1.5);
    };

    const zoomOut = () => {
      svg.transition().call(zoom.scaleBy, 1 / 1.5);
    };

    const resetZoom = () => {
      svg.transition().call(zoom.transform, d3.zoomIdentity);
    };

    // Store zoom functions for button controls
    (svg.node() as any).zoomIn = zoomIn;
    (svg.node() as any).zoomOut = zoomOut;
    (svg.node() as any).resetZoom = resetZoom;

    return () => {
      simulation.stop();
    };
  }, [entities, relationships, dimensions]);

  const exportMindMap = () => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    
    const blob = new Blob([source], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = '/images/mindmap.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleZoomIn = () => {
    const svg = svgRef.current as any;
    if (svg?.zoomIn) svg.zoomIn();
  };

  const handleZoomOut = () => {
    const svg = svgRef.current as any;
    if (svg?.zoomOut) svg.zoomOut();
  };

  const handleResetZoom = () => {
    const svg = svgRef.current as any;
    if (svg?.resetZoom) svg.resetZoom();
  };

  if (entities.length === 0) {
    return (
      <Card className="cyber-card">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="text-6xl mb-4">🕸</div>
            <h3 className="text-lg font-semibold mb-2">No Entity Data Available</h3>
            <p className="text-gray-400">Run AI analysis to generate the mind map</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="cyber-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span className="text-neon-green">🧠</span>
              <span>Entity Relationship Map</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                className="neon-button info"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                className="neon-button info"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetZoom}
                className="neon-button"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportMindMap}
                className="neon-button"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="relative">
            <div 
              ref={containerRef}
              className="w-full bg-black/20 rounded-lg border border-neon-green/30 overflow-hidden"
              style={{ height: '600px' }}
            >
              <svg
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
                className="w-full h-full"
              />
            </div>

            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-4 right-4 bg-black/80 border border-neon-green p-4 rounded-lg"
              >
                <h4 className="font-semibold text-neon-green mb-2">Selected Entity</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Type:</strong> <Badge variant="outline" className="ml-1">{selectedNode.type}</Badge></div>
                  <div><strong>Value:</strong> {selectedNode.value}</div>
                  <div><strong>Confidence:</strong> {Math.round(selectedNode.confidence * 100)}%</div>
                  <div><strong>Mentions:</strong> {selectedNode.mentions}</div>
                </div>
              </motion.div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-black/80 border border-neon-green/30 p-3 rounded-lg">
              <h4 className="font-semibold text-neon-green mb-2 text-sm">Entity Types</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries({
                  person: '#00ff41',
                  email: '#00d4ff',
                  phone: '#ff0040',
                  location: '#a855f7',
                  username: '#ffff00',
                  organization: '#ff8c00'
                }).map(([type, color]) => (
                  <div key={type} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color, filter: 'drop-shadow(0 0 3px currentColor)' }}
                    />
                    <span className="capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}